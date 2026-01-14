
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
import {
  UserIcon,
  FlagIcon,
} from 'react-native-heroicons/outline';

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

interface ContextMenuReanimatedProps {
  children: React.ReactNode;
  onViewProfile?: () => void;
  onReport?: () => void;
  // Optional: Custom menu items
  menuItems?: Array<{
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    color?: string;
  }>;
  // Callback when menu state changes
  onMenuStateChange?: (isOpen: boolean) => void;
  // Expose close function to parent
  onCloseRef?: (closeFn: () => void) => void;
}

export const ContextMenuReanimated: React.FC<ContextMenuReanimatedProps> = ({
  children,
  onViewProfile,
  onReport,
  menuItems,
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
  
  // Calculate menu items - create icons dynamically
  const items = menuItems || [
    ...(onViewProfile ? [{ 
      label: 'View Profile', 
      icon: <UserIcon width={20} height={20} color={isDark ? '#fff' : '#000'} />, 
      onPress: onViewProfile 
    }] : []),
    ...(onReport ? [{ 
      label: 'Report', 
      icon: <FlagIcon width={20} height={20} color="#FF3040" />, 
      onPress: onReport, 
      color: '#FF3040' 
    }] : []),
  ];
  
  const menuHeight = items.length * MENU_ITEM_HEIGHT + (MENU_PADDING * 2);
  
  // Debug: Log items on mount and when they change
  React.useEffect(() => {
    console.log('[ContextMenuReanimated] Items changed', { 
      itemsCount: items.length, 
      hasOnViewProfile: !!onViewProfile,
      hasOnReport: !!onReport,
      menuHeight 
    });
  }, [items.length, onViewProfile, onReport, menuHeight]);
  
  // Debug: Log isOpen changes
  React.useEffect(() => {
    console.log('[ContextMenuReanimated] isOpen changed', { isOpen, menuPosition });
    // Notify parent component about menu state change
    onMenuStateChange?.(isOpen);
  }, [isOpen, menuPosition, onMenuStateChange]);

  // Close menu
  const closeMenu = useCallback(() => {
    console.log('[ContextMenuReanimated] closeMenu called');
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
    console.log('[ContextMenuReanimated] handleTriggerLayout called', { x, y, width, height });
    
    // onLayout'dan gelen x, y zaten parent container'a göre koordinatlar
    // Ama measure ile window koordinatlarını almak için ref kullan
    if (triggerRef.current) {
      triggerRef.current.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
        console.log('[ContextMenuReanimated] measure in onLayout', { px, py, w, h, x, y });
        // px, py parent container'a göre koordinatlar
        setTriggerLayout({ x: px, y: py, width: w, height: h });
      });
    } else {
      // Ref henüz hazır değilse, onLayout'dan gelen x, y'yi kullan (parent container'a göre)
      console.log('[ContextMenuReanimated] Using onLayout x, y directly', { x, y, width, height });
      setTriggerLayout({ x, y, width, height });
    }
  }, []);

  // Toggle menu
  const handleToggle = useCallback(() => {
    console.log('[ContextMenuReanimated] handleToggle called', { isOpen, itemsCount: items.length });
    
    if (!isOpen) {
      console.log('[ContextMenuReanimated] Opening menu...', { 
        triggerRefExists: !!triggerRef.current,
        triggerLayout,
        onViewProfile: !!onViewProfile,
        onReport: !!onReport 
      });
      
      // Önce triggerLayout state'ini kullan (onLayout'dan gelmiş olabilir)
      if (triggerLayout) {
        console.log('[ContextMenuReanimated] Using triggerLayout state', triggerLayout);
        const buttonLeft = triggerLayout.x;
        const menuLeft = buttonLeft - MENU_WIDTH + 10; // 10px sağa kaydır
        const screenWidth = Dimensions.get('window').width;
        const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
        const top = triggerLayout.y - 8; // Butonun üstüne hizala, 8px yukarı
        
        console.log('[ContextMenuReanimated] Setting menu position from triggerLayout', { top, left, buttonLeft, menuLeft });
        setMenuPosition({ top, left });
        setIsOpen(true);
        progress.value = withSpring(1, SPRING_CONFIG);
      } else if (triggerRef.current) {
        // Fallback: measure kullan
        triggerRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
          console.log('[ContextMenuReanimated] measure result', { px, py, width, height, fx, fy });
          const buttonLeft = px;
          const menuLeft = buttonLeft - MENU_WIDTH ; // 10px sağa kaydır
          const screenWidth = Dimensions.get('window').width;
          const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
          const top = py - 8; // Butonun üstüne hizala, 8px yukarı
          
          console.log('[ContextMenuReanimated] Setting menu position from measure', { top, left, buttonLeft, menuLeft });
          setMenuPosition({ top, left });
          setIsOpen(true);
          progress.value = withSpring(1, SPRING_CONFIG);
        });
      } else {
        console.error('[ContextMenuReanimated] triggerRef.current is null and no triggerLayout!');
        // Ref henüz hazır değilse, InteractionManager ile render tamamlandıktan sonra dene
        InteractionManager.runAfterInteractions(() => {
          if (triggerRef.current) {
            triggerRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
              console.log('[ContextMenuReanimated] measure after InteractionManager', { px, py, width, height });
              const buttonLeft = px;
              const menuLeft = buttonLeft - MENU_WIDTH ; // 10px sağa kaydır
              const screenWidth = Dimensions.get('window').width;
              const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
              const top = py -8; // Butonun üstüne hizala, 8px yukarı
              
              setMenuPosition({ top, left });
              setIsOpen(true);
              progress.value = withSpring(1, SPRING_CONFIG);
            });
          } else {
            console.error('[ContextMenuReanimated] Still null after InteractionManager!');
            // Son çare: try to open anyway
            setIsOpen(true);
            progress.value = withSpring(1, SPRING_CONFIG);
          }
        });
      }
    } else {
      console.log('[ContextMenuReanimated] Closing menu...');
      closeMenu();
    }
  }, [isOpen, progress, closeMenu, items.length, onViewProfile, onReport, triggerLayout]);

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
      zIndex: 1000, // PostCard içinde üstte görünsün
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
            zIndex: 998, // Menu'den düşük (menu zIndex: 1000)
          }}
          onPress={closeMenu}
        />
      )}

      {/* Animated Menu - positioned relative to parent container (PostCard içinde) */}
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
              elevation: 10, // Android
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
              {items.map((item, index) => {
                console.log('[ContextMenuReanimated] Rendering menu item', { index, label: item.label });
                return (
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
                );
              })}
            </VStack>
          </RNPressable>
        </Animated.View>
      )}
    </View>
  );
};
