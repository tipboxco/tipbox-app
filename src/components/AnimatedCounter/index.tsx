import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

// ARCHITECTURE FIX: Removed config import to prevent StyledProvider errors
// Using hardcoded color mapping instead of config.tokens

interface AnimatedCounterProps {
  value: number;
  color?: string;
  fontSize?: string | number;
  ml?: number;
}

// Color token mapping - hardcoded to avoid StyledProvider dependency
const colorTokenMap: Record<string, string> = {
  // Light mode colors
  backgroundLight0: '#FFFFFF',
  backgroundLight50: '#F9FAFB',
  backgroundLight100: '#F3F4F6',
  backgroundLight200: '#E5E7EB',
  textLight50: '#F9FAFB',
  textLight100: '#F3F4F6',
  textLight200: '#E5E7EB',
  textLight300: '#D1D5DB',
  textLight400: '#9CA3AF',
  textLight500: '#6B7280',
  textLight600: '#4B5563',
  textLight700: '#374151',
  textLight800: '#1F2937',
  textLight900: '#111827',
  textLight950: '#030712',
  // Dark mode colors
  backgroundDark0: '#0F172A',
  backgroundDark50: '#1E293B',
  backgroundDark100: '#334155',
  backgroundDark200: '#475569',
  backgroundDark800: '#1E293B',
  backgroundDark900: '#0F172A',
  backgroundDark950: '#020617',
  textDark50: '#F8FAFC',
  textDark100: '#F1F5F9',
  textDark200: '#E2E8F0',
  textDark300: '#CBD5E1',
  textDark400: '#94A3B8',
  textDark500: '#64748B',
  textDark600: '#475569',
  textDark700: '#334155',
  textDark800: '#1E293B',
  textDark900: '#0F172A',
  textDark950: '#020617',
  // Primary colors
  primary500: '#818CF8',
  primary600: '#6366F1',
};

// Token'ı gerçek renk değerine çevir
const resolveColorToken = (colorToken: string | undefined): string | undefined => {
  if (!colorToken) return undefined;
  
  // Eğer zaten hex color ise direkt döndür
  if (colorToken.startsWith('#')) {
    return colorToken;
  }
  
  // Token ise (örn: $textDark50) gerçek renk değerini al
  if (colorToken.startsWith('$')) {
    const tokenName = colorToken.substring(1); // $ işaretini kaldır
    const colorValue = colorTokenMap[tokenName];
    return colorValue || colorToken; // Token bulunamazsa orijinal değeri döndür
  }
  
  return colorToken;
};

// Font size'ı sayıya çevir (Gluestack token'ları için)
const resolveFontSize = (fontSize: string | number | undefined): number => {
  if (typeof fontSize === 'number') {
    return fontSize;
  }
  
  if (typeof fontSize === 'string') {
    // Gluestack font size token'ları
    const fontSizeMap: Record<string, number> = {
      '$4xs': 8,
      '$3xs': 9,
      '$2xs': 10,
      '$xs': 12,
      '$sm': 14,
      '$md': 16,
      '$lg': 18,
      '$xl': 20,
    };
    
    return fontSizeMap[fontSize] || 10; // Default: $2xs
  }
  
  return 10; // Default
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  color,
  fontSize = '$2xs',
  ml = 4,
}) => {
  // Token'ı gerçek renk değerine çevir
  const resolvedColor = useMemo(() => resolveColorToken(color), [color]);
  
  // Font size'ı sayıya çevir
  const resolvedFontSize = useMemo(() => resolveFontSize(fontSize), [fontSize]);

  // Her rakam için animasyon değerleri
  const valueString = value.toString();
  const digits = valueString.split('');

  return (
    <View style={[styles.container, { marginLeft: ml, flexDirection: 'row' }]}>
      {digits.map((digit, index) => (
        <AnimatedDigit
          key={`${digit}-${index}-${value}`}
          digit={digit}
          fontSize={resolvedFontSize}
          color={resolvedColor || '#000'}
        />
      ))}
    </View>
  );
};

interface AnimatedDigitProps {
  digit: string;
  fontSize: number;
  color: string;
}

const AnimatedDigit: React.FC<AnimatedDigitProps> = ({ digit, fontSize, color }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Yeni rakam geldiğinde animasyonu tetikle
    translateY.value = 10; // Aşağıdan başla
    opacity.value = 0;
    
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 250,
    });
    opacity.value = withTiming(1, { duration: 120 });
  }, [digit]);

  // PERFORMANCE FIX: Add 'worklet' directive for native thread execution
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.digitContainer, animatedStyle]}>
      <Text style={{ fontSize, color }}>{digit}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  digitContainer: {
    overflow: 'hidden',
  },
});

