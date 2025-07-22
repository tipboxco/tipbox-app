'use client';
import { createConfig } from '@gluestack-ui/themed';
import { config as defaultConfig } from '@gluestack-ui/config';

export const config = createConfig({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      light: {
        background: '#FFFFFF',
        backgroundLight0: '#FFFFFF',
        backgroundLight50: '#F9FAFB',
        backgroundLight100: '#F3F4F6',
        backgroundLight200: '#E5E7EB',
        textLight50: '#F9FAFB',
        textLight100: '#F3F4F6',
        textLight200: '#E5E7EB',
        textLight300: '#D1D5DB',
        textLight400: '#9CA3AF',
        textLight500: '#6B7280',
        textLight600: '#4B5563',
        textLight700: '#374151',
        textLight800: '#1F2937',
        textLight900: '#111827',
        textLight950: '#030712',
        primary500: '#6366F1',
        primary600: '#4F46E5',
      },
      dark: {
        background: '#111827',
        backgroundDark0: '#111827',
        backgroundDark50: '#1F2937',
        backgroundDark100: '#374151',
        backgroundDark200: '#4B5563',
        textDark50: '#F9FAFB',
        textDark100: '#F3F4F6',
        textDark200: '#E5E7EB',
        textDark300: '#D1D5DB',
        textDark400: '#9CA3AF',
        textDark500: '#6B7280',
        textDark600: '#4B5563',
        textDark700: '#374151',
        textDark800: '#1F2937',
        textDark900: '#111827',
        textDark950: '#030712',
        primary500: '#818CF8',
        primary600: '#6366F1',
      }
    },
  },
  aliases: {
    bg: 'backgroundColor',
    bgColor: 'backgroundColor',
    rounded: 'borderRadius',
  },
});
