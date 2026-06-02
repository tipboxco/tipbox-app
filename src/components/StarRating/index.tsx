import React from 'react';
import { Pressable } from 'react-native';
import { HStack } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  onRate?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 24,
  color = '#FFD700',
  onRate,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack space="sm">
      {Array.from({ length: maxRating }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => onRate?.(index + 1)}
        >
          <Feather
            name={index < rating ? 'star' : 'star'}
            size={size}
            color={index < rating ? color : (isDark ? '#555555' : '#CCCCCC')}
          />
        </Pressable>
      ))}
    </HStack>
  );
};
