import React, { useState, useCallback, useRef } from 'react';
import { View, Pressable as RNPressable, Modal, Dimensions, InteractionManager } from 'react-native';
import { Pressable, VStack, HStack, Divider, Text } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';

// Spring configuration
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Menu constants
const MENU_BORDER_RADIUS = 12;
const MENU_WIDTH = 200;

export interface PostCardMenuItem {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  color?: string;
}

interface PostCardContextMenuProps {
  children: React.ReactNode;
  items: PostCardMenuItem[];
}

export const PostCardContextMenu: React.FC<PostCardContextMenuProps> = ({
  children,
  items,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const progress = useSharedValue(0);

  // Menu height: VStack padding (8 top + 12 bottom) + items (~35px per item) + dividers (1px per divider)
  const menuHeight = 20 + (items.length * 35) + ((items.length - 1) * 1);

  // Close menu
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    progress.value = withSpring(0, SPRING_CONFIG);
  }, [progress]);

  // Handle layout measurement
  const handleTriggerLayout = useCallback((event: any) => {
    if (triggerRef.current) {
      triggerRef.current.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
        setTriggerLayout({ x: px, y: py, width: w, height: h });
      });
    } else {
      const { x, y, width, height } = event.nativeEvent.layout;
      setTriggerLayout({ x, y, width, height });
    }
  }, []);

  // Toggle menu
  const handleToggle = useCallback(() => {
    if (!isOpen) {
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
            setIsOpen(true);
            progress.value = withSpring(1, SPRING_CONFIG);
          }
        });
      }
    } else {
      closeMenu();
    }
  }, [isOpen, progress, closeMenu, triggerLayout]);

  // Menu animated style
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
        <Pressable onPress={handleToggle}>
          {children}
        </Pressable>
      </View>

      {/* Overlay */}
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

      {/* Animated Menu */}
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
            <VStack pt={8} pb={12} pl={12} pr={8} width="100%">
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
                        color={item.color || (isDark ? '#FFFFFF' : '#000000')}
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
