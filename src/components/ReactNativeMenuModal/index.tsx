import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal as RNModal, Pressable as RNPressable, View, Dimensions, InteractionManager } from 'react-native';
import { Box, Text, Pressable, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useSafeAreaValues } from '@/src/utils';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  color?: string; // Text color override (e.g., '#FF3040' for destructive actions)
}

export interface ReactNativeMenuModalProps {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  // Fixed position (absolute coordinates)
  position?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  // Trigger-based positioning (menu opens relative to trigger button)
  triggerRef?: React.RefObject<View | null>;
  // Pre-measured trigger position (from onLayout callback)
  triggerPosition?: { x: number; y: number; width: number; height: number };
  placement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  offsetX?: number; // Horizontal offset from trigger
  offsetY?: number; // Vertical offset from trigger
  width?: number;
  maxHeight?: number | string;
  // Callback when menu state changes
  onMenuStateChange?: (isOpen: boolean) => void;
}

/**
 * ReactNativeMenuModal - Performant native modal-based menu component
 * 
 * Features:
 * - Native Modal for better performance
 * - Fade animation (no lag)
 * - Consistent design (font, gap, padding)
 * - Dark mode support
 * - Flexible positioning
 * 
 * Usage:
 * ```tsx
 * <ReactNativeMenuModal
 *   visible={isMenuOpen}
 *   onClose={() => setIsMenuOpen(false)}
 *   items={[
 *     { label: 'Share', icon: <Icon />, onPress: handleShare },
 *     { label: 'Report', icon: <Icon />, onPress: handleReport, color: '#FF3040' },
 *   ]}
 *   position={{ top: 50, right: 16 }}
 *   width={200}
 * />
 * ```
 */
const MENU_WIDTH = 180; // Default menu width

export const ReactNativeMenuModal: React.FC<ReactNativeMenuModalProps> = ({
  visible,
  onClose,
  items,
  position,
  triggerRef,
  triggerPosition,
  placement = 'top-left',
  offsetX = 0,
  offsetY = -8,
  width = MENU_WIDTH,
  maxHeight = '80%',
  onMenuStateChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const safeAreaTop = useSafeAreaValues('top');
  const [calculatedPosition, setCalculatedPosition] = useState<{ top?: number; left?: number; right?: number; bottom?: number }>({});

  // Notify parent about menu state changes
  useEffect(() => {
    onMenuStateChange?.(visible);
  }, [visible, onMenuStateChange]);

  // Calculate position from trigger ref or pre-measured position
  useEffect(() => {
    if (visible && !position) {
      // Priority 1: Use pre-measured trigger position (most reliable)
      if (triggerPosition) {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        let menuLeft: number;
        let menuTop: number;

        switch (placement) {
          case 'top-right':
            menuLeft = triggerPosition.x + triggerPosition.width - width + offsetX;
            menuTop = triggerPosition.y + offsetY;
            break;
          case 'top-left':
            menuLeft = triggerPosition.x - width + offsetX;
            menuTop = triggerPosition.y + offsetY;
            break;
          case 'bottom-right':
            menuLeft = triggerPosition.x + triggerPosition.width - width + offsetX;
            menuTop = triggerPosition.y + triggerPosition.height + Math.abs(offsetY);
            break;
          case 'bottom-left':
            menuLeft = triggerPosition.x - width + offsetX;
            menuTop = triggerPosition.y + triggerPosition.height + Math.abs(offsetY);
            break;
          default:
            menuLeft = triggerPosition.x - width + offsetX;
            menuTop = triggerPosition.y + offsetY;
        }

        // Ensure menu doesn't go off screen
        const left = Math.max(12, Math.min(menuLeft, screenWidth - width - 12));
        const top = Math.max(12, Math.min(menuTop, screenHeight - 100));

        console.log('[ReactNativeMenuModal] Position from triggerPosition:', {
          triggerPosition,
          placement,
          calculated: { menuLeft, menuTop },
          final: { left, top },
          screenSize: { width: screenWidth, height: screenHeight },
          menuWidth: width,
        });

        setCalculatedPosition({ left, top });
        return;
      }

      // Priority 2: Measure from triggerRef
      if (triggerRef?.current) {
        let retryCount = 0;
        const maxRetries = 5;
        
        const calculatePosition = () => {
          if (!triggerRef?.current) {
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(calculatePosition, 50);
            }
            return;
          }

          // Try to measure the view
          try {
            triggerRef.current.measureInWindow((x, y, w, h) => {
              // If position is (0,0) and dimensions are 0, view might not be rendered yet
              // Also check if dimensions are reasonable (at least 1px)
              if ((x === 0 && y === 0 && (w === 0 || h === 0)) && retryCount < maxRetries) {
                retryCount++;
                setTimeout(calculatePosition, 50);
                return;
              }

              const screenWidth = Dimensions.get('window').width;
              const screenHeight = Dimensions.get('window').height;
              let menuLeft: number;
              let menuTop: number;

              switch (placement) {
                case 'top-right':
                  menuLeft = x + w - width + offsetX;
                  menuTop = y + offsetY;
                  break;
                case 'top-left':
                  menuLeft = x - width + offsetX;
                  menuTop = y + offsetY;
                  break;
                case 'bottom-right':
                  menuLeft = x + w - width + offsetX;
                  menuTop = y + h + Math.abs(offsetY);
                  break;
                case 'bottom-left':
                  menuLeft = x - width + offsetX;
                  menuTop = y + h + Math.abs(offsetY);
                  break;
                default:
                  menuLeft = x - width + offsetX;
                  menuTop = y + offsetY;
              }

              // Ensure menu doesn't go off screen
              const left = Math.max(12, Math.min(menuLeft, screenWidth - width - 12));
              const top = Math.max(12, Math.min(menuTop, screenHeight - 100));

              console.log('[ReactNativeMenuModal] Position from measureInWindow:', {
                measured: { x, y, w, h },
                placement,
                calculated: { menuLeft, menuTop },
                final: { left, top },
                screenSize: { width: screenWidth, height: screenHeight },
                menuWidth: width,
                offsetX,
                offsetY,
              });

              setCalculatedPosition({ left, top });
            });
          } catch (error) {
            // If measurement fails, retry
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(calculatePosition, 50);
            }
          }
        };

        // Use requestAnimationFrame + setTimeout for reliable measurement
        requestAnimationFrame(() => {
          setTimeout(calculatePosition, 10);
        });
      }
    } else if (position) {
      // Use fixed position
      console.log('[ReactNativeMenuModal] Using fixed position:', position);
      setCalculatedPosition(position);
    } else if (!visible) {
      // Reset position when menu closes
      setCalculatedPosition({});
    }
  }, [visible, triggerRef, triggerPosition, position, placement, offsetX, offsetY, width]);

  // Calculate position with safe area for fixed positions
  const topPosition = calculatedPosition.top !== undefined 
    ? (position?.top !== undefined ? safeAreaTop + calculatedPosition.top : calculatedPosition.top)
    : (position?.top !== undefined ? safeAreaTop + position.top : undefined);
  const bottomPosition = calculatedPosition.bottom ?? position?.bottom;
  const rightPosition = calculatedPosition.right ?? position?.right;
  const leftPosition = calculatedPosition.left ?? position?.left;

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <RNPressable
        style={{ flex: 1 }}
        onPress={onClose}
      />
      <Box
        position="absolute"
        top={topPosition}
        bottom={bottomPosition}
        right={rightPosition}
        left={leftPosition}
        width={width}
        maxHeight={maxHeight}
        bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        borderRadius={16}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.25}
        shadowRadius={8}
        elevation={8}
        overflow="hidden"
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Box h={1} bg={isDark ? '#333333' : '#E9E9E9'} />
            )}
            <Pressable
              onPress={() => {
                if (!item.disabled) {
                  onClose();
                  item.onPress();
                }
              }}
              px={16}
              py={12}
              disabled={item.disabled}
              opacity={item.disabled ? 0.6 : 1}
            >
              <HStack alignItems="center" space="md">
                {item.icon}
                <Text
                  color={item.color || (isDark ? '$textDark50' : '#000000')}
                  fontSize="$md"
                  fontWeight="$medium"
                >
                  {item.label}
                </Text>
              </HStack>
            </Pressable>
          </React.Fragment>
        ))}
      </Box>
    </RNModal>
  );
};
