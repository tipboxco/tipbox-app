import React from 'react';
import { Box, HStack, Text, Pressable, VStack } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

interface RightButtonProps {
  text: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
  onPress: () => void;
  disabled?: boolean;
}

interface HeaderProps {
  title: string;
  // Sol kısım için props
  leftAction?: 'back' | 'menu' | 'cancel';
  onLeftActionPress?: () => void;
  // Sağ kısım için props
  showThreeDots?: boolean;
  onThreeDotsPress?: () => void;
  showFilter?: boolean;
  onFilterPress?: () => void;
  showShare?: boolean;
  onSharePress?: () => void;
  rightButton?: RightButtonProps;
  // Geriye uyumluluk için eski props
  onMenuPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  onSearchPress?: () => void;
}

export const Header = ({
  title,
  leftAction,
  onLeftActionPress,
  showThreeDots,
  onThreeDotsPress,
  showFilter,
  onFilterPress,
  showShare,
  onSharePress,
  rightButton,
  // Geriye uyumluluk için eski props
  onMenuPress,
  showBackButton = false,
  onBackPress,
  rightAction,
  onSearchPress
}: HeaderProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Navigation'ı her zaman çağır - NavigationContainer dışındaysa hata fırlatır
  // Bu durumda Header component'i NavigationContainer içinde kullanılmalı
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  // Sol kısım için render fonksiyonu
  const renderLeftAction = () => {
    // Yeni props öncelikli
    if (leftAction) {
      let iconName: string;
      let onPress = onLeftActionPress;

      switch (leftAction) {
        case 'back':
          iconName = 'arrow-left';
          // Back için fallback: navigation.goBack()
          if (!onPress) {
            onPress = () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            };
          }
          break;
        case 'menu':
          iconName = 'menu';
          // Menu için drawer aç
          if (!onPress) {
            return (
              <Pressable onPress={() => navigation.openDrawer()}>
                <Feather
                  name={iconName as any}
                  size={22}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              </Pressable>
            );
          }
          break;
        case 'cancel':
          iconName = 'x';
          // Cancel için onPress zorunlu (modal/conditional render içinde kullanılıyor)
          // Fallback yok, çünkü modal içinde navigation.goBack() çalışmaz
          break;
        default:
          return null;
      }

      // onPress undefined ise buton render edilmemeli
      if (!onPress) {
        return null;
      }

      return (
        <Pressable 
          onPress={onPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather
            name={iconName as any}
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    // Geriye uyumluluk için eski props
    if (showBackButton && onBackPress) {
      return (
        <Pressable onPress={onBackPress}>
          <Feather
            name="arrow-left"
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    if (onMenuPress) {
      return (
        <Pressable onPress={() => {
          navigation.openDrawer();
          onMenuPress();
        }}>
          <Feather
            name="menu"
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    return null;
  };

  // Sağ kısım için render fonksiyonu
  const renderRightActions = () => {
    const actions = [];

    // 3 noktalı icon buton
    if (showThreeDots && onThreeDotsPress) {
      actions.push(
        <Pressable key="three-dots" onPress={onThreeDotsPress} mr={showFilter || rightButton ? '$2' : '$0'}>
          <VStack space="xs" alignItems="center">
            <Box
              width={4}
              height={4}
              borderRadius="$full"
              bg={isDark ? '#FFFFFF' : '#000000'}
            />
            <Box
              width={4}
              height={4}
              borderRadius="$full"
              bg={isDark ? '#FFFFFF' : '#000000'}
            />
            <Box
              width={4}
              height={4}
              borderRadius="$full"
              bg={isDark ? '#FFFFFF' : '#000000'}
            />
          </VStack>
        </Pressable>
      );
    }

    // Filtreleme butonu
    if (showFilter && onFilterPress) {
      actions.push(
        <Pressable key="filter" onPress={onFilterPress} mr={showShare || rightButton ? '$2' : '$0'}>
          <Feather
            name="filter"
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    // Paylaşma butonu
    if (showShare && onSharePress) {
      actions.push(
        <Pressable key="share" onPress={onSharePress} mr={rightButton ? '$2' : '$0'}>
          <Feather
            name="share-2"
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    // Normal Button
    if (rightButton) {
      actions.push(
        <Pressable 
          key="right-button" 
          onPress={rightButton.onPress}
          disabled={rightButton.disabled}
          opacity={rightButton.disabled ? 0.5 : 1}
        >
          <Box
            bg={rightButton.backgroundColor || (isDark ? '#8B5CF6' : '#8B5CF6')}
            borderWidth={rightButton.borderWidth !== undefined ? rightButton.borderWidth : 0}
            borderColor={rightButton.borderColor || 'transparent'}
            px={'$4'}
            py={'$2'}
            borderRadius={rightButton.borderRadius !== undefined ? rightButton.borderRadius : 8}
          >
            <Text
              color={rightButton.textColor || '#FFFFFF'}
              fontSize={rightButton.fontSize || 14}
              fontWeight="$medium"
            >
              {rightButton.text}
            </Text>
          </Box>
        </Pressable>
      );
    }

    // Geriye uyumluluk için eski rightAction
    if (!actions.length && rightAction) {
      return (
        <Box width={24} height={24} alignItems="center" justifyContent="center">
          {rightAction}
        </Box>
      );
    }

    // Geriye uyumluluk için eski onSearchPress
    if (!actions.length && onSearchPress) {
      return (
        <Pressable onPress={onSearchPress}>
          <Feather
            name="search"
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    return actions.length > 0 ? (
      <HStack space="sm" alignItems="center">
        {actions}
      </HStack>
    ) : null;
  };

  return (
    <VStack>
      <Box
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
        px="$4"
        justifyContent="center"
      >
        <Box my="$2">
          <HStack space="md" alignItems="center">
            {/* Sol kısım - Flex1, flex-start */}
            <Box flex={1} alignItems="flex-start" justifyContent="center">
              {renderLeftAction()}
            </Box>

            {/* Orta kısım - Flex3, center */}
            <Box flex={3} alignItems="center" justifyContent="center">
              <Text
                color={isDark ? '$textDark50' : '$textLight900'}
                fontSize="$md"
                fontWeight="$bold"
                textAlign="center"
              >
                {title}
              </Text>
            </Box>

            {/* Sağ kısım - Flex1, flex-end */}
            <Box flex={1} alignItems="flex-end" justifyContent="center">
              {renderRightActions()}
            </Box>
          </HStack>
        </Box>
      </Box>
    </VStack>
  );
};