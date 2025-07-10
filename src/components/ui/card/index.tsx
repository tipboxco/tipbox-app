import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors, space, radii, getShadow } from '../theme';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'elevated', 
  size = 'md',
  style,
  ...props 
}) => {
  const getCardStyles = () => {
    const baseStyles = {
      backgroundColor: colors.white,
      borderRadius: radii.lg,
      padding: size === 'sm' ? space[3] : size === 'lg' ? space[6] : space[4],
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          ...getShadow('md'),
        };
      case 'outline':
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: colors.gray[200],
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.gray[50],
        };
      default:
        return baseStyles;
    }
  };

  return (
    <View style={[getCardStyles(), style]} {...props}>
      {children}
    </View>
  );
}; 