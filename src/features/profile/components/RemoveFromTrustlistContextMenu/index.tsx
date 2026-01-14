
import React, { useState, useCallback, useRef } from 'react';
import { Text as RNText, Dimensions, View, InteractionManager, Pressable as RNPressable } from 'react-native';
import { Pressable, Box, VStack, HStack, Divider, Text } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import { XCircleIcon, BellIcon } from 'react-native-heroicons/outline';

// Custom Mute Icon - çan simgesi üzerinde Z harfi (görseldeki gibi)
const MuteIcon: React.FC<{ color: string }> = ({ color }) => {
  return (
    <Box position="relative" width={20} height={20} alignItems="center" justifyContent="center">
      <BellIcon width={20} height={20} color={color} />
      <RNText
        style={{
          position: 'absolute',
          top: -1,
          left: 3,
          fontSize: 9,
          fontWeight: '700',
          color: color,
        }}
      >
        Z
      </RNText>
    </Box>
  );
};

// Spring configuration for natural feel
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Menu item height - dikey padding azaltıldığı için küçültüldü
const MENU_ITEM_HEIGHT = 40;
const MENU_PADDING = 8;
const MENU_BORDER_RADIUS = 12; // Görselde yuvarlak köşeler var
const MENU_WIDTH = 200; // Görseldeki menü genişliğine göre ayarlandı

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
  
  // Calculate menu items - görseldeki sıraya göre
  const iconColor = isDark ? '#fff' : '#000';
  const items = [
    ...(onRemoveFromTrustList ? [{ 
      label: 'Remove from Trust List', 
      icon: <XCircleIcon width={20} height={20} color={iconColor} />, 
      onPress: onRemoveFromTrustList 
    }] : []),
    ...(onMute ? [{ 
      label: 'Mute', 
      icon: <MuteIcon color={iconColor} />, 
      onPress: onMute 
    }] : []),
    ...(onBlock ? [{ 
      label: 'Block', 
      icon: <XCircleIcon width={20} height={20} color={iconColor} />, 
      onPress: onBlock,
      color: undefined // Block için özel renk yok, görselde siyah
    }] : []),
  ];
  
  const menuHeight = items.length * MENU_ITEM_HEIGHT + (MENU_PADDING * 2);

  // Debug: Log component mount and items
  React.useEffect(() => {
    console.log('[RemoveFromTrustlistContextMenu] Component mounted/updated', {
      itemsCount: items.length,
      hasOnRemoveFromTrustList: !!onRemoveFromTrustList,
      hasOnMute: !!onMute,
      hasOnBlock: !!onBlock,
      menuHeight,
    });
  }, [items.length, onRemoveFromTrustList, onMute, onBlock, menuHeight]);

  // Debug: Log isOpen changes
  React.useEffect(() => {
    console.log('[RemoveFromTrustlistContextMenu] isOpen changed', { 
      isOpen, 
      menuPosition,
      triggerLayout 
    });
    // Notify parent component about menu state change
    onMenuStateChange?.(isOpen);
  }, [isOpen, menuPosition, triggerLayout, onMenuStateChange]);

  // Debug: Log menu render
  React.useEffect(() => {
    if (isOpen) {
      console.log('[RemoveFromTrustlistContextMenu] Menu should be visible', { 
        isOpen, 
        menuPosition, 
        itemsCount: items.length,
        menuHeight 
      });
    }
  }, [isOpen, menuPosition, items.length, menuHeight]);

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
    console.log('[RemoveFromTrustlistContextMenu] handleTriggerLayout called', { x, y, width, height });
    
    // measure kullanarak parent container'a göre koordinatları al
    if (triggerRef.current) {
      triggerRef.current.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
        // px, py parent container'a göre koordinatlar
        console.log('[RemoveFromTrustlistContextMenu] measure result', { px, py, w, h, fx, fy });
        setTriggerLayout({ x: px, y: py, width: w, height: h });
      });
    } else {
      // Ref henüz hazır değilse, onLayout'dan gelen x, y'yi kullan (parent container'a göre)
      console.log('[RemoveFromTrustlistContextMenu] Using onLayout values directly', { x, y, width, height });
      setTriggerLayout({ x, y, width, height });
    }
  }, []);

  // Toggle menu
  const handleToggle = useCallback(() => {
    console.log('[RemoveFromTrustlistContextMenu] handleToggle called', { isOpen, triggerLayout: !!triggerLayout });
    
    if (!isOpen) {
      // Önce triggerLayout state'ini kullan (parent container'a göre)
      if (triggerLayout) {
        const buttonLeft = triggerLayout.x;
        const buttonRight = buttonLeft + triggerLayout.width;
        const screenWidth = Dimensions.get('window').width;
        const minMargin = 12;
        
        // Agresif offset - menüyü çok daha sola al
        const offset = 60; // Çok agresif offset
        // Menüyü button'ın sol kenarından hesapla - MENU_WIDTH - offset kadar sola git
        let menuLeft = buttonLeft - MENU_WIDTH - offset;
        
        // Menü ekranın dışına çıkmaması için kontrol et
        let left = Math.max(minMargin, menuLeft);
        
        // Eğer menü hala ekranın sağında taşıyorsa, daha da sola al
        if (left + MENU_WIDTH > screenWidth - minMargin) {
          // Menüyü ekranın sağ kenarından MENU_WIDTH + margin kadar sola yerleştir
          left = screenWidth - MENU_WIDTH - minMargin - 40; // Ekstra 40px daha sola
          // Ama yine de button'ın solunda olmalı
          if (left > buttonLeft) {
            left = buttonLeft - MENU_WIDTH - offset;
          }
          left = Math.max(minMargin, left);
        }
        
        const top = triggerLayout.y - 8;
        
        console.log('[RemoveFromTrustlistContextMenu] Setting menu position (AGGRESSIVE)', { 
          buttonLeft,
          buttonRight,
          menuLeft, 
          left, 
          top,
          screenWidth,
          MENU_WIDTH,
          offset,
          triggerLayout,
          menuRight: left + MENU_WIDTH,
          calculatedLeft: buttonLeft - MENU_WIDTH - offset
        });
        
        setMenuPosition({ top, left });
        setIsOpen(true);
        progress.value = withSpring(1, SPRING_CONFIG);
      } else if (triggerRef.current) {
        // Fallback: measure kullan (parent container'a göre)
        triggerRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
          const buttonLeft = px;
          const buttonRight = buttonLeft + width;
          const screenWidth = Dimensions.get('window').width;
          const minMargin = 12;
          
          // Agresif offset
          const offset = 60;
          let menuLeft = buttonLeft - MENU_WIDTH - offset;
          
          let left = Math.max(minMargin, menuLeft);
          
          // Eğer menü hala ekranın sağında taşıyorsa, daha da sola al
          if (left + MENU_WIDTH > screenWidth - minMargin) {
            left = screenWidth - MENU_WIDTH - minMargin - 40;
            if (left > buttonLeft) {
              left = buttonLeft - MENU_WIDTH - offset;
            }
            left = Math.max(minMargin, left);
          }
          
          const top = py - 8;
          
          console.log('[RemoveFromTrustlistContextMenu] Setting menu position from measure (AGGRESSIVE)', { 
            buttonLeft,
            buttonRight,
            menuLeft, 
            left, 
            top,
            screenWidth,
            MENU_WIDTH,
            offset,
            menuRight: left + MENU_WIDTH,
            calculatedLeft: buttonLeft - MENU_WIDTH - offset
          });
          
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
              const buttonRight = buttonLeft + width;
              const screenWidth = Dimensions.get('window').width;
              const minMargin = 12;
              
              // Agresif offset
              const offset = 60;
              let menuLeft = buttonLeft - MENU_WIDTH - offset;
              
              let left = Math.max(minMargin, menuLeft);
              
              // Eğer menü hala ekranın sağında taşıyorsa, daha da sola al
              if (left + MENU_WIDTH > screenWidth - minMargin) {
                left = screenWidth - MENU_WIDTH - minMargin - 40;
                if (left > buttonLeft) {
                  left = buttonLeft - MENU_WIDTH - offset;
                }
                left = Math.max(minMargin, left);
              }
              
              const top = py - 8;
              
              setMenuPosition({ top, left });
              setIsOpen(true);
              progress.value = withSpring(1, SPRING_CONFIG);
            });
          } else {
            // Son çare: try to open anyway
            console.log('[RemoveFromTrustlistContextMenu] Opening menu without position');
            setIsOpen(true);
            progress.value = withSpring(1, SPRING_CONFIG);
          }
        });
      }
    } else {
      console.log('[RemoveFromTrustlistContextMenu] Closing menu');
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
      zIndex: 10000, // Yüksek z-index - card içinde görünmesi için
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

  console.log('[RemoveFromTrustlistContextMenu] Rendering component', { 
    isOpen, 
    itemsCount: items.length,
    hasChildren: !!children 
  });

  return (
    <View style={{ position: 'relative', overflow: 'visible' }}>
      {/* Trigger Button */}
      <View 
        ref={triggerRef}
        collapsable={false}
        onLayout={(e) => {
          console.log('[RemoveFromTrustlistContextMenu] onLayout called');
          handleTriggerLayout(e);
        }}
      >
        <RNPressable 
          onPress={() => {
            console.log('[RemoveFromTrustlistContextMenu] RNPressable pressed - handleToggle will be called');
            handleToggle();
          }}
          onPressIn={() => {
            console.log('[RemoveFromTrustlistContextMenu] RNPressable onPressIn');
          }}
          style={{ 
            padding: 8,
            backgroundColor: 'transparent' // Test için görünür yap
          }}
        >
          {children}
        </RNPressable>
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
            zIndex: 9999, // Menüden düşük ama yüksek z-index
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
              zIndex: 10000, // Yüksek z-index - card içinde görünmesi için
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
                <React.Fragment key={index}>
                  {index > 0 && (
                    <Divider 
                      bg={isDark ? '#333333' : '#E9E9E9'} 
                      mx={0}
                    />
                  )}
                  <Pressable
                    onPress={() => handleMenuItemPress(item.onPress)}
                    px={16}
                    py={8}
                  >
                    <HStack alignItems="center" space="md">
                      {item.icon}
                      <Text
                        color={item.color || (isDark ? '#FFFFFF' : '#000000')}
                        fontSize="$md"
                        fontWeight="$medium"
                      >
                        {item.label}
                      </Text>
                    </HStack>
                  </Pressable>
                </React.Fragment>
              ))}
            </VStack>
          </RNPressable>
        </Animated.View>
      )}
    </View>
  );
};
