import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { colors, fontSizes, fontWeights } from '../theme';

interface TextProps extends RNTextProps {
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: string;
}

export const Text: React.FC<TextProps> = ({ 
  children, 
  variant = 'body',
  size,
  weight,
  color,
  style,
  ...props 
}) => {
  const getTextStyles = () => {
    let fontSize: number = fontSizes.md;
    let fontWeight: string = fontWeights.normal;
    let textColor: string = colors.gray[700];

    // Variant styles
    switch (variant) {
      case 'heading':
        fontSize = fontSizes['3xl'] as number;
        fontWeight = fontWeights.bold as string;
        break;
      case 'subheading':
        fontSize = fontSizes.xl as number;
        fontWeight = fontWeights.semibold as string;
        break;
      case 'body':
        fontSize = fontSizes.md as number;
        fontWeight = fontWeights.normal as string;
        break;
      case 'caption':
        fontSize = fontSizes.sm as number;
        textColor = colors.gray[500] as string;
        break;
      case 'label':
        fontSize = fontSizes.sm as number;
        fontWeight = fontWeights.medium as string;
        break;
    }

    // Override with props
    if (size) fontSize = fontSizes[size] as number;
    if (weight) fontWeight = fontWeights[weight] as string;
    if (color) textColor = color;

    return {
      fontSize,
      fontWeight: fontWeight as any,
      color: textColor,
    };
  };

  return (
    <RNText style={[getTextStyles(), style]} {...props}>
      {children}
    </RNText>
  );
}; 