export const colors = {
  background: {
    primary: { light: '#FFFFFF', dark: '#000000' },
    secondary: { light: '#F5F5F5', dark: '#1A1A1A' },
    tertiary: { light: '#FAFAFA', dark: '#0A0A0A' },
    elevated: { light: '#FFFFFF', dark: '#2A2A2A' },
  },
  text: {
    primary: { light: '#000000', dark: '#FFFFFF' },
    secondary: { light: '#666666', dark: '#AAAAAA' },
    tertiary: { light: '#8C8C8C', dark: '#8C8C8C' },
    muted: { light: '#999999', dark: '#555555' },
  },
  border: {
    primary: { light: '#E9E9E9', dark: '#333333' },
    secondary: { light: '#E0E0E0', dark: '#2A2A2A' },
    subtle: { light: '#F0F0F0', dark: '#1A1A1A' },
  },
  icon: {
    primary: { light: '#000000', dark: '#FFFFFF' },
    secondary: { light: '#666666', dark: '#999999' },
    muted: { light: '#CCCCCC', dark: '#555555' },
  },
  brand: {
    primary: '#6366F1',
    accent: '#BBFF4E',
    cta: '#D0F205',
    ctaDisabled: { light: '#EDEDED', dark: '#333333' },
  },
  status: {
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
  },
  tabBar: {
    active: '#758600',
    background: { light: '#FAFAFA', dark: '#000000' },
  },
  placeholder: {
    background: { light: '#F5F5F5', dark: '#2A2A2A' },
    icon: { light: '#CCCCCC', dark: '#555555' },
  },
} as const;

export type ThemeColor = { light: string; dark: string };

export const getColor = (color: ThemeColor, isDark: boolean): string =>
  isDark ? color.dark : color.light;
