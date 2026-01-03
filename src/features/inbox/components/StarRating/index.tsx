import React from 'react';
import { HStack, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  color?: string;
  outlineColor?: string;
  showOutline?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 32,
  color = '#FFD700',
  outlineColor = '#D1D5DB',
  showOutline = false,
}) => {
  return (
    <HStack space="sm" justifyContent="center">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;
        const starColor = isFilled ? color : (showOutline ? outlineColor : '#D1D5DB');
        const starFill = isFilled ? color : 'transparent';
        
        return (
          <Pressable key={star} onPress={() => onRatingChange(star)}>
            <Feather
              name={showOutline && !isFilled ? 'star' : 'star'}
              size={size}
              color={starColor}
              fill={starFill}
              style={{ marginHorizontal: 4 }}
            />
          </Pressable>
        );
      })}
    </HStack>
  );
};

export default StarRating;

