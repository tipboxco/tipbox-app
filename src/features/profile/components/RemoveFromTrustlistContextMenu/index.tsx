
import React, { useState, useCallback, useRef } from 'react';
import { Text as RNText, Dimensions, View, InteractionManager, Pressable as RNPressable } from 'react-native';
import { Pressable, Box, VStack, HStack } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

// Spring configuration for natural feel
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Menu item height
const MENU_ITEM_HEIGHT = 48;
const MENU_PADDING = 8;
const MENU_BORDER_RADIUS = 8;
const MENU_WIDTH = 180;

interface RemoveFromTrustlistContextMenuProps {
  children: React.ReactNode;
  onRemoveFromTrustList?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  // Callback when menu state changes
  onMenuStateChange?: (isOpen: boolean) => void;
  // Expose close function to parent
  onCloseRef?: (closeFn: () => void) => void;
}

export const RemoveFromTrustlistContextMenu: React.FC<RemoveFromTrustlistContextMenuProps> = ({
  children,
  onRemoveFromTrustList,
  onMute,
  onBlock,
  onMenuStateChange,
  onCloseRef,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // 🎯 CORE: Single progress sharedValue (0 = closed, 1 = open)
  const progress = useSharedValue(0);
  
  // Calculate menu items
  const items = [
    ...(onRemoveFromTrustList ? [{ 
      label: 'Remove from Trust List', 
      icon: <Feather name="user-x" size={20} color={isDark ? '#fff' : '#000'} />, 
      onPress: onRemoveFromTrustList 
    }] : []),
    ...(onMute ? [{ 
      label: 'Mute', 
      icon: <Feather name="bell-off" size={20} color={isDark ? '#fff' : '#000'} />, 
      onPress: onMute 
    }] : []),
    ...(onBlock ? [{ 
      label: 'Block', 
      icon: <Feather name="slash" size={20} color="#FF3040" />, 
      onPress: onBlock,
      color: '#FF3040' 
    }] : []),
  ];
  
  const menuHeight = items.length * MENU_ITEM_HEIGHT + (MENU_PADDING * 2);

  // Debug: Log isOpen changes
  React.useEffect(() => {
    // Notify parent component about menu state change
    onMenuStateChange?.(isOpen);
  }, [isOpen, onMenuStateChange]);

  // Close menu
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    progress.value = withSpring(0, SPRING_CONFIG);
  }, [progress]);

  // Expose close function to parent
  React.useEffect(() => {
    onCloseRef?.(closeMenu);
  }, [closeMenu, onCloseRef]);

  // Handle layout measurement - onLayout'dan gelen bilgileri kullan
  const handleTriggerLayout = useCallback((event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    // measure kullanarak parent container'a göre koordinatları al
    if (triggerRef.current) {
      triggerRef.current.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
        // px, py parent container'a göre koordinatlar
        setTriggerLayout({ x: px, y: py, width: w, height: h });
      });
    } else {
      // Ref henüz hazır değilse, onLayout'dan gelen x, y'yi kullan (parent container'a göre)
      setTriggerLayout({ x, y, width, height });
    }
  }, []);

  // Toggle menu
  const handleToggle = useCallback(() => {
    if (!isOpen) {
      // Önce triggerLayout state'ini kullan (parent container'a göre)
      if (triggerLayout) {
        const buttonLeft = triggerLayout.x;
        const menuLeft = buttonLeft - MENU_WIDTH;
        const screenWidth = Dimensions.get('window').width;
        const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
        const top = triggerLayout.y - 8;
        
        setMenuPosition({ top, left });
        setIsOpen(true);
        progress.value = withSpring(1, SPRING_CONFIG);
      } else if (triggerRef.current) {
        // Fallback: measure kullan (parent container'a göre)
        triggerRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
          const buttonLeft = px;
          const menuLeft = buttonLeft - MENU_WIDTH;
          const screenWidth = Dimensions.get('window').width;
          const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
          const top = py - 8;
          
          setMenuPosition({ top, left });
          setIsOpen(true);
          progress.value = withSpring(1, SPRING_CONFIG);
        });
      } else {
        // Ref henüz hazır değilse, InteractionManager ile render tamamlandıktan sonra dene
        InteractionManager.runAfterInteractions(() => {
          if (triggerRef.current) {
            triggerRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
              const buttonLeft = px;
              const menuLeft = buttonLeft - MENU_WIDTH;
              const screenWidth = Dimensions.get('window').width;
              const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
              const top = py - 8;
              
              setMenuPosition({ top, left });
              setIsOpen(true);
              progress.value = withSpring(1, SPRING_CONFIG);
            });
          } else {
            // Son çare: try to open anyway
            setIsOpen(true);
            progress.value = withSpring(1, SPRING_CONFIG);
          }
        });
      }
    } else {
      closeMenu();
    }
  }, [isOpen, progress, closeMenu, triggerLayout]);

  // Menu animated style - absolute positioned relative to parent container
  const menuStyle = useAnimatedStyle(() => {
    'worklet';
    const height = interpolate(progress.value, [0, 1], [0, menuHeight]);
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const scale = interpolate(progress.value, [0, 1], [0.95, 1]);
    
    return {
      position: 'absolute' as const,
      top: menuPosition.top,
      left: menuPosition.left,
      width: MENU_WIDTH,
      height,
      opacity,
      transform: [{ scale }],
      overflow: 'hidden' as const,
      zIndex: 1000,
    };
  });

  // Handle menu item press
  const handleMenuItemPress = useCallback((onPress: () => void) => {
    closeMenu();
    // Small delay to allow close animation
    setTimeout(() => {
      onPress();
    }, 150);
  }, [closeMenu]);

  return (
    <View style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <View 
        ref={triggerRef}
        collapsable={false}
        onLayout={handleTriggerLayout}
      >
        <Pressable onPress={handleToggle}>
          {children}
        </Pressable>
      </View>

      {/* Overlay - menu açıkken boşluğa tıklamayı yakalamak için (menu'den önce render edilir, z-index menu'den düşük) */}
      {isOpen && (
        <RNPressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 998,
          }}
          onPress={closeMenu}
        />
      )}

      {/* Animated Menu - positioned relative to parent container */}
      {isOpen && (
        <Animated.View
          style={[
            menuStyle,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              borderRadius: MENU_BORDER_RADIUS,
              borderWidth: 1,
              borderColor: isDark ? '#333333' : '#E9E9E9',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 10,
            },
          ]}
          pointerEvents="box-none"
        >
          <RNPressable 
            onPress={(e) => e.stopPropagation()}
            style={{ flex: 1 }}
          >
            <VStack py={MENU_PADDING} width="100%">
              {items.length === 0 && (
                <Box px={16} py={12}>
                  <RNText style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 12 }}>
                    No menu items
                  </RNText>
                </Box>
              )}
              {items.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleMenuItemPress(item.onPress)}
                  px={16}
                  py={12}
                >
                  <HStack alignItems="center" space="md">
                    {item.icon}
                    <RNText
                      style={{
                        color: item.color || (isDark ? '#FFFFFF' : '#000000'),
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                    >
                      {item.label}
                    </RNText>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </RNPressable>
        </Animated.View>
      )}
    </View>
  );
};
