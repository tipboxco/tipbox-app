import React from 'react';
import { HStack, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  color?: string;
  outlineColor?: string;
  showOutline?: boolean;
}

// Custom Star SVG Component
const StarIcon: React.FC<{ size: number; color: string; filled: boolean }> = ({ size, color, filled }) => {
  // Star path - 5 köşeli yıldız
  const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={starPath}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 32,
  color = '#FFD700',
  outlineColor = '#D1D5DB',
  showOutline = false,
}) => {
  return (
    <HStack space="md" justifyContent="center" alignItems="center">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;
        const starColor = isFilled ? color : (showOutline ? outlineColor : '#D1D5DB');
        
        return (
          <Pressable 
            key={star} 
            onPress={() => onRatingChange(star)}
            style={{ marginHorizontal: 2 }}
          >
            <StarIcon size={size} color={starColor} filled={isFilled} />
          </Pressable>
        );
      })}
    </HStack>
  );
};

export default StarRating;

