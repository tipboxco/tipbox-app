import React, { memo, useMemo, useCallback } from 'react';
import { Box, HStack, Text, Pressable, VStack, Image } from '@gluestack-ui/themed';
import {
  ChevronLeftIcon,
  Bars3Icon,
  XMarkIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
} from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { useDrawerStore } from '@/src/store/drawerStore';

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
  title?: string;
  logo?: any; // Logo image source (require() veya ImageSourcePropType)
  backgroundColor?: string;
  textColor?: string;
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

const HeaderComponent = ({
  title,
  logo,
  backgroundColor,
  textColor,
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
  const navigation = useNavigation<any>();
  
  // Drawer store'dan drawer actions al
  const openDrawer = useDrawerStore((state) => state.openDrawer);
  
  // PERFORMANCE FIX: Memoize drawer open handler to prevent re-renders
  // CRITICAL: React Navigation drawer'ı açmak için navigation.openDrawer() kullan
  const handleOpenDrawer = useCallback(() => {
    // React Navigation drawer'ı aç
    if (navigation.getParent) {
      const drawerNavigation = navigation.getParent();
      if (drawerNavigation && 'openDrawer' in drawerNavigation) {
        (drawerNavigation as any).openDrawer();
      }
    }
    // Drawer store'u da güncelle (sync için)
    openDrawer();
  }, [navigation, openDrawer]);

  // PERFORMANCE FIX: Memoize render functions to prevent re-renders
  // Static configuration - no inline functions to prevent unmount-remount
  // Sol kısım için render fonksiyonu
  const renderLeftAction = useMemo(() => {
    // Yeni props öncelikli
    if (leftAction) {
      let iconName: string;
      let onPress = onLeftActionPress;

      let IconComponent: React.ComponentType<{ width?: number; height?: number; color?: string }> | null = null;

      switch (leftAction) {
        case 'back':
          IconComponent = ChevronLeftIcon;
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
          IconComponent = Bars3Icon;
          // Menu için drawer aç (React Navigation drawer)
          if (!onPress) {
            return (
              <Pressable onPress={handleOpenDrawer}>
                <Bars3Icon
                  width={22}
                  height={22}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              </Pressable>
            );
          }
          break;
        case 'cancel':
          IconComponent = XMarkIcon;
          // Cancel için onPress zorunlu (modal/conditional render içinde kullanılıyor)
          // Fallback yok, çünkü modal içinde navigation.goBack() çalışmaz
          break;
        default:
          return null;
      }

      // onPress undefined ise buton render edilmemeli
      if (!onPress || !IconComponent) {
        return null;
      }

      return (
        <Pressable 
          onPress={onPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconComponent
            width={22}
            height={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    // Geriye uyumluluk için eski props
    if (showBackButton && onBackPress) {
      return (
        <Pressable onPress={onBackPress}>
          <ChevronLeftIcon
            width={22}
            height={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    if (onMenuPress) {
      return (
        <Pressable onPress={() => {
          openDrawer();
          onMenuPress();
        }}>
          <Bars3Icon
            width={22}
            height={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    return null;
  }, [leftAction, onLeftActionPress, showBackButton, onBackPress, onMenuPress, isDark, handleOpenDrawer, openDrawer]);

  // PERFORMANCE FIX: Memoize right actions render to prevent re-renders
  // Sağ kısım için render fonksiyonu
  const renderRightActions = useMemo(() => {
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
          <FunnelIcon
            width={22}
            height={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
      );
    }

    // Paylaşma butonu
    if (showShare && onSharePress) {
      actions.push(
        <Pressable key="share" onPress={onSharePress} mr={rightButton ? '$2' : '$0'}>
          <ArrowTopRightOnSquareIcon
            width={22}
            height={22}
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
          <MagnifyingGlassIcon
            width={22}
            height={22}
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
  }, [showThreeDots, onThreeDotsPress, showFilter, onFilterPress, showShare, onSharePress, rightButton, rightAction, onSearchPress, isDark]);

  // PERFORMANCE FIX: Fixed header height for consistent tab transitions
  // All screens use the same header height to prevent lag/trembling during tab transitions
  const HEADER_MIN_HEIGHT = 56; // Header base height (my="$2" + content ~40px)

  // PERFORMANCE FIX: Memoize background color and text color to prevent re-renders
  const headerBgColor = useMemo(() => backgroundColor || (isDark ? '#000000' : '#FFFFFF'), [backgroundColor, isDark]);
  const headerTextColor = useMemo(() => textColor || (isDark ? '#FFFFFF' : '#000000'), [textColor, isDark]);

  // Truncate title to max 20 characters for header display
  const truncatedTitle = useMemo(() => {
    if (!title) return '';
    const MAX_LENGTH = 20;
    if (title.length > MAX_LENGTH) {
      return title.substring(0, MAX_LENGTH).trim() + '...';
    }
    return title;
  }, [title]);

  return (
    <VStack>
      <Box
        bg={headerBgColor}
        px="$4"
        justifyContent="center"
        minHeight={HEADER_MIN_HEIGHT}
      >
        <HStack space="md" alignItems="center">
            {/* Sol kısım - Flex1, flex-start */}
            <Box flex={1} alignItems="flex-start" justifyContent="center">
              {renderLeftAction}
            </Box>

            {/* Orta kısım - Flex3, center */}
            {/* PERFORMANCE FIX: Static configuration - logo/title render memoized */}
            <Box flex={3} alignItems="center" justifyContent="center">
              {logo ? (
                <Image
                  source={logo}
                  alt="Logo"
                  width={120}
                  height={40}
                  resizeMode="contain"
                />
              ) : title ? (
                <Text
                  color={headerTextColor}
                  fontSize="$md"
                  fontWeight="$bold"
                  textAlign="center"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {truncatedTitle}
                </Text>
              ) : null}
            </Box>

            {/* Sağ kısım - Flex1, flex-end */}
            <Box flex={1} alignItems="flex-end" justifyContent="center">
              {renderRightActions}
            </Box>
          </HStack>
      </Box>
    </VStack>
  );
};

// PERFORMANCE FIX: Memoize Header component to prevent unnecessary re-renders
// Header is used in many screens and should only re-render when props actually change
export const Header = memo(HeaderComponent, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.title === nextProps.title &&
    prevProps.logo === nextProps.logo &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.textColor === nextProps.textColor &&
    prevProps.leftAction === nextProps.leftAction &&
    prevProps.showThreeDots === nextProps.showThreeDots &&
    prevProps.showFilter === nextProps.showFilter &&
    prevProps.showShare === nextProps.showShare &&
    prevProps.showBackButton === nextProps.showBackButton &&
    prevProps.rightButton === nextProps.rightButton &&
    prevProps.onLeftActionPress === nextProps.onLeftActionPress &&
    prevProps.onThreeDotsPress === nextProps.onThreeDotsPress &&
    prevProps.onFilterPress === nextProps.onFilterPress &&
    prevProps.onSharePress === nextProps.onSharePress &&
    prevProps.onBackPress === nextProps.onBackPress &&
    prevProps.onMenuPress === nextProps.onMenuPress &&
    prevProps.onSearchPress === nextProps.onSearchPress &&
    prevProps.rightAction === nextProps.rightAction
  );
});
Header.displayName = 'Header';