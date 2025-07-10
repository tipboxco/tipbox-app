import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { colors, space, radii, fontSizes } from '../theme';
import { Text } from '../text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export const Input: React.FC<InputProps> = ({ 
  label,
  error,
  variant = 'outline',
  size = 'md',
  style,
  ...props 
}) => {
  const getInputStyles = () => {
    const baseStyles = {
      fontSize: fontSizes.md,
      color: colors.gray[700],
      padding: size === 'sm' ? space[2] : size === 'lg' ? space[4] : space[3],
      borderRadius: radii.md,
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: error ? colors.red[500] : colors.gray[300],
          backgroundColor: colors.white,
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: colors.gray[50],
          borderWidth: 0,
        };
      default:
        return baseStyles;
    }
  };

  return (
    <View style={{ marginBottom: space[4] }}>
      {label && (
        <Text 
          variant="label" 
          color={colors.gray[700]}
          style={{ marginBottom: space[2] }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[getInputStyles(), style]}
        placeholderTextColor={colors.gray[400]}
        {...props}
      />
      {error && (
        <Text 
          variant="caption" 
          color={colors.red[500]}
          style={{ marginTop: space[1] }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}; 