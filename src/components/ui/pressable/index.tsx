import React from 'react';
import { Pressable as RNPressable, PressableProps, View } from 'react-native';
import { colors, space, radii, getShadow } from '../theme';
import { Text } from '../text';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  colorScheme?: 'primary' | 'secondary' | 'gray' | 'red';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children,
  variant = 'solid',
  colorScheme = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props 
}) => {
  const getButtonStyles = () => {
    const colorMap = {
      primary: colors.primary,
      secondary: colors.secondary,
      gray: colors.gray,
      red: colors.red,
    };

    const currentColors = colorMap[colorScheme];
    
    let padding;
    switch (size) {
      case 'xs':
        padding = { paddingVertical: space[1], paddingHorizontal: space[2] };
        break;
      case 'sm':
        padding = { paddingVertical: space[2], paddingHorizontal: space[3] };
        break;
      case 'lg':
        padding = { paddingVertical: space[4], paddingHorizontal: space[6] };
        break;
      default:
        padding = { paddingVertical: space[3], paddingHorizontal: space[4] };
    }

    const baseStyles = {
      borderRadius: radii.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      ...padding,
    };

    switch (variant) {
      case 'solid':
        return {
          ...baseStyles,
          backgroundColor: disabled ? colors.gray[300] : currentColors[500],
          ...getShadow('sm'),
        };
      case 'outline':
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: disabled ? colors.gray[300] : currentColors[500],
          backgroundColor: 'transparent',
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
        };
      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          padding: 0,
        };
      default:
        return baseStyles;
    }
  };

  const getTextColor = () => {
    const colorMap = {
      primary: colors.primary,
      secondary: colors.secondary,
      gray: colors.gray,
      red: colors.red,
    };

    const currentColors = colorMap[colorScheme];

    if (disabled) return colors.gray[500];

    switch (variant) {
      case 'solid':
        return colors.white;
      case 'outline':
      case 'ghost':
      case 'link':
        return currentColors[500];
      default:
        return colors.white;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'xs':
        return 'xs' as const;
      case 'sm':
        return 'sm' as const;
      case 'lg':
        return 'lg' as const;
      default:
        return 'md' as const;
    }
  };

  return (
    <RNPressable 
      style={getButtonStyles()} 
      disabled={disabled || isLoading}
      {...props}
    >
      {leftIcon && <View style={{ marginRight: space[2] }}>{leftIcon}</View>}
      <Text 
        size={getTextSize()} 
        weight="semibold" 
        color={getTextColor()}
      >
        {isLoading ? 'Yükleniyor...' : children}
      </Text>
      {rightIcon && <View style={{ marginLeft: space[2] }}>{rightIcon}</View>}
    </RNPressable>
  );
}; 