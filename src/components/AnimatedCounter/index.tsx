import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';

interface AnimatedCounterProps {
  value: number;
  color?: string;
  fontSize?: string | number;
  ml?: number;
}

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
    const colorValue = config.tokens.colors[tokenName as keyof typeof config.tokens.colors];
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

  const animatedStyle = useAnimatedStyle(() => {
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
