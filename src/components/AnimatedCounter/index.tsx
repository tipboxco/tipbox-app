import React, { useEffect, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import { Text } from '@gluestack-ui/themed';
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

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  color,
  fontSize = '$2xs',
  ml = 4,
}) => {
  const previousValue = useRef(value);
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Token'ı gerçek renk değerine çevir
  const resolvedColor = useMemo(() => resolveColorToken(color), [color]);

  useEffect(() => {
    // Değer değiştiğinde animasyonu tetikle
    if (previousValue.current !== value) {
      const isIncreasing = value > previousValue.current;
      
      // Eski değeri yukarı kaydır (Twitter mantığı: her zaman yukarı kayar)
      Animated.timing(translateY, {
        toValue: -15, // Yukarı kaydır
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Animasyon tamamlandıktan sonra yeni değeri göster
        previousValue.current = value;
        
        // Yeni değeri aşağıdan başlat (aşağıdan gelsin)
        translateY.setValue(15);
        
        // Yeni değeri yukarı kaydır (normal pozisyona getir)
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [value, translateY]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        overflow: 'hidden', // Taşan kısımları gizle
      }}
    >
      <Text color={resolvedColor} ml={ml} fontSize={fontSize}>
        {value}
      </Text>
    </Animated.View>
  );
};

