import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';

/**
 * Notification Toast Component
 * 
 * WhatsApp/Instagram tarzı in-app notification toast:
 * - Ekranın üstünde görünür
 * - 3 saniye sonra yukarı kayıp kaybolur
 * - Tıklanabilir (navigation)
 */
interface NotificationToastProps {
  visible: boolean;
  title: string;
  message: string;
  avatar?: string | number;
  onPress?: () => void;
  onDismiss: () => void;
  duration?: number; // ms
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  visible,
  title,
  message,
  avatar,
  onPress,
  onDismiss,
  duration = 3000, // 3 saniye
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();
  
  // Animasyon değerleri
  const slideAnim = useRef(new Animated.Value(-200)).current; // Başlangıç: yukarıda (görünmez)
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Göster: Aşağı kay (slide down)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, // Ekranın üstüne gel
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 3 saniye sonra gizle
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    // Gizle: Yukarı kay (slide up)
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200, // Yukarı kay
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + 10,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <Pressable onPress={onPress}>
        <Box
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
          borderRadius={12}
          borderWidth={1}
          borderColor={isDark ? '#2A2A2A' : '#E9E9E9'}
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.15}
          shadowRadius={8}
          elevation={8}
          px="$4"
          py="$3"
        >
          <HStack space="md" alignItems="center">
            {/* Avatar */}
            {avatar && (
              <Box
                width={40}
                height={40}
                borderRadius={20}
                overflow="hidden"
                bg={isDark ? '#2A2A2A' : '#F2F2F2'}
              >
                <Image
                  source={toImageSource(avatar)}
                  alt="Avatar"
                  width={40}
                  height={40}
                  style={{ borderRadius: 20 }}
                />
              </Box>
            )}

            {/* Content */}
            <VStack flex={1} space="xs">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={14}
                fontWeight="$semibold"
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                color={isDark ? '#8C8C8C' : '#666666'}
                fontSize={12}
                numberOfLines={2}
              >
                {message}
              </Text>
            </VStack>

            {/* Close Icon */}
            <Pressable
              onPress={hideToast}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name="x"
                size={18}
                color={isDark ? '#8C8C8C' : '#666666'}
              />
            </Pressable>
          </HStack>
        </Box>
      </Pressable>
    </Animated.View>
  );
};

export default NotificationToast;

