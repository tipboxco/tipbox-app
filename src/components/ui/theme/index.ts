import { gluestackConfig } from '../../../config/gluestack.config';

// Quick access to config values
export const theme = gluestackConfig;

// Helper functions for easy access
export const colors = theme.colors;
export const space = theme.space;
export const fontSizes = theme.fontSizes;
export const fontWeights = theme.fontWeights;
export const radii = theme.radii;
export const shadows = theme.shadows;

// Utility functions
export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let color: any = colors;

  for (const key of keys) {
    color = color[key];
    if (!color) return '#000000';
  }

  return color;
};

export const getSpace = (spaceKey: keyof typeof space) => {
  return space[spaceKey] || 0;
};

export const getFontSize = (sizeKey: keyof typeof fontSizes) => {
  return fontSizes[sizeKey] || 16;
};

export const getShadow = (shadowKey: keyof typeof shadows) => {
  return shadows[shadowKey] || shadows.sm;
};
