import React, { useState, useCallback, useRef } from 'react';
import { Text as RNText, Dimensions, View, InteractionManager, Pressable as RNPressable, Modal } from 'react-native';
import { Pressable, Box, VStack, HStack, Divider, Text } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import { XCircleIcon, BellIcon } from 'react-native-heroicons/outline';

// Custom Mute Icon - çan simgesi üzerinde Z harfi
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

// Spring configuration
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Menu constants
const MENU_ITEM_HEIGHT = 40;
const MENU_PADDING = 8;
const MENU_BORDER_RADIUS = 12;
const MENU_WIDTH = 200;

interface RemoveFromTrustlistContextMenuProps {
  children: React.ReactNode;
  onRemoveFromTrustList?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onMenuStateChange?: (isOpen: boolean) => void;
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
  
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const progress = useSharedValue(0);
  
  // Menu items
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
    }] : []),
  ];
  
  // Menu height: VStack padding (12 top + 12 bottom) + items (her item py={10} + text height ~15px = ~35px per item) + dividers (1px per divider)
  // Her item için: py={10} (20px padding) + text height (~15px) = ~35px
  const menuHeight = 24 + (items.length * 35) + ((items.length - 1) * 1);

  // Close menu
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    progress.value = withSpring(0, SPRING_CONFIG);
  }, [progress]);

  // Expose close function to parent
  React.useEffect(() => {
    onCloseRef?.(closeMenu);
  }, [closeMenu, onCloseRef]);

  // Notify parent about menu state
  React.useEffect(() => {
    onMenuStateChange?.(isOpen);
  }, [isOpen, onMenuStateChange]);

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

  // Toggle menu - PostCard'daki gibi
  const handleToggle = useCallback(() => {
    if (!isOpen) {
      // Önce triggerLayout state'ini kullan
      if (triggerLayout) {
        const buttonLeft = triggerLayout.x;
        const menuLeft = buttonLeft - MENU_WIDTH; // Butonun soluna yerleştir
        const screenWidth = Dimensions.get('window').width;
        const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
        const top = triggerLayout.y - 8; // Butonun üstüne hizala, 8px yukarı
        
        setMenuPosition({ top, left });
        setIsOpen(true);
        progress.value = withSpring(1, SPRING_CONFIG);
      } else if (triggerRef.current) {
        // Fallback: measure kullan
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
      zIndex: 10000,
    };
  });

  // Handle menu item press
  const handleMenuItemPress = useCallback((onPress: () => void) => {
    closeMenu();
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
        <Pressable 
          onPress={handleToggle}
        >
          {children}
        </Pressable>
      </View>

      {/* Overlay - menu açıkken boşluğa tıklamayı yakalamak için */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <RNPressable
          style={{
            flex: 1,
            backgroundColor: 'transparent',
          }}
          onPress={closeMenu}
        />
      </Modal>

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
            <VStack p={12} width="100%">
              {items.length === 0 && (
                <Box px={12} py={12}>
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
                    py={10}
                  >
                    <HStack alignItems="center" justifyContent="flex-start" space="xs">
                      {item.icon}
                      <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
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
