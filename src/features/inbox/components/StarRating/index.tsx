import React from 'react';
import { HStack, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  color?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 32,
  color = '#FFD700',
}) => {
  return (
    <HStack space="sm" justifyContent="center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onRatingChange(star)}>
          <Feather
            name={star <= rating ? 'star' : 'star'}
            size={size}
            color={star <= rating ? color : '#D1D5DB'}
            fill={star <= rating ? color : 'transparent'}
            style={{ marginHorizontal: 4 }}
          />
        </Pressable>
      ))}
    </HStack>
  );
};

export default StarRating;

