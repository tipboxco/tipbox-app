import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomSheetHost } from '@/src/components/overlays/BottomSheetHost';
import { ContextMenuHost } from '@/src/components/overlays/ContextMenuHost';
import { ToastHost } from '@/src/components/overlays/ToastHost';

/**
 * GlobalUIHost Component
 * 
 * Instagram/Twitter-style global UI overlay architecture
 * 
 * All global UI components (BottomSheet, ContextMenu, Toast, etc.) are rendered here
 * at the root level, outside of navigation hierarchy.
 * 
 * CRITICAL: pointerEvents="box-none" ensures touch events pass through to underlying screens
 * This allows overlay components to be interactive while not blocking navigation gestures.
 * 
 * Architecture:
 * ```
 * NavigationContainer
 *   └── GlobalUIHost (absoluteFill, pointerEvents="box-none")
 *       ├── BottomSheetHost
 *       ├── ContextMenuHost
 *       └── ToastHost
 * ```
 * 
 * This ensures:
 * - UI components are always accessible regardless of active screen
 * - Events can reach UI components even when detail screens are open
 * - No ownership conflicts between navigation and UI
 * - Touch events pass through to underlying screens (pointerEvents="box-none")
 */
export const GlobalUIHost: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <BottomSheetHost />
      <ContextMenuHost />
      <ToastHost />
    </View>
  );
};
