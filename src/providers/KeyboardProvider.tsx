import React, { ReactNode } from 'react';
import { KeyboardProvider as RNKeyboardProvider } from 'react-native-keyboard-controller';

interface KeyboardProviderProps {
  children: ReactNode;
}

/**
 * KeyboardProvider Component
 * 
 * Wrapper for react-native-keyboard-controller's KeyboardProvider
 * Provides keyboard context to all child components, especially for bottom sheets
 * 
 * Architecture:
 * - Must be placed after GlobalBottomSheetProvider in the provider hierarchy
 * - Enables keyboard-aware behavior for bottom sheets and input fields
 */
export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ children }) => {
  return <RNKeyboardProvider>{children}</RNKeyboardProvider>;
};
