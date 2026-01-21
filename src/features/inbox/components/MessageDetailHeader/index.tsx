import React, { useState, useRef, useMemo } from 'react';
import {
  Box,
  HStack,
  Text,
  Pressable,
  VStack,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';
import { ReactNativeMenuModal, MenuItem } from '@/src/components/ReactNativeMenuModal';
import { View } from 'react-native';
import {
  ArrowUpTrayIcon,
  FlagIcon,
  NoSymbolIcon,
} from 'react-native-heroicons/outline';

interface MessageDetailHeaderProps {
  senderName: string;
  senderTitle: string;
  senderAvatar: any;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onShare?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  recipientUserId?: string;
}

export const MessageDetailHeader: React.FC<MessageDetailHeaderProps> = ({
  senderName,
  senderTitle,
  senderAvatar,
  onBackPress,
  onMenuPress,
  onShare,
  onBlock,
  onReport,
  recipientUserId,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);

  // Menu items - only show if recipientUserId is provided (not own profile)
  const menuItems = useMemo<MenuItem[]>(() => {
    if (!recipientUserId) return [];
    
    return [
      {
        label: 'Share',
        icon: <ArrowUpTrayIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
        onPress: () => {
          if (onShare) {
            onShare();
          }
        },
      },
      {
        label: 'Report',
        icon: <FlagIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />,
        onPress: () => {
          if (onReport) {
            onReport();
          }
        },
      },
      {
        label: 'Block',
        icon: <NoSymbolIcon width={20} height={20} color="#FF3040" />,
        onPress: () => {
          if (onBlock) {
            onBlock();
          }
        },
        color: '#FF3040',
      },
    ];
  }, [recipientUserId, isDark, onShare, onReport, onBlock]);

  return (
    <VStack
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={1}
      borderColor={isDark ? '#333' : '#E9E9E9'}
    >
      {/* Header Section */}
      <Box
        px="$4"
        py="$2"
        justifyContent="center"
      >
        <HStack space="md" alignItems="center" justifyContent="space-between">
          {/* Geri Butonu */}
          <Pressable onPress={onBackPress}>
            <Feather
              name="arrow-left"
              size={22}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Pressable>

          {/* Kullanıcı Bilgisi - Orta */}
          <HStack
            flex={1}
            space="sm"
            alignItems="center"
            justifyContent="center"
            px="$2"
          >
            <Image
              source={
                toImageSource(senderAvatar) ||
                require('@/assets/avatar/default-useravatar.png')
              }
              alt={senderName}
              width={48}
              height={48}
              borderRadius={16}
            />
            <VStack flex={1} space="xs">
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={12}
                fontWeight="$semibold"
                numberOfLines={1}
              >
                {senderName}
              </Text>
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize={9}
                fontWeight="$normal"
                numberOfLines={1}
              >
                {senderTitle}
              </Text>
            </VStack>
          </HStack>

          {/* Menü Butonu */}
          <View ref={menuTriggerRef} collapsable={false}>
            <Pressable onPress={() => {
              if (menuItems.length > 0) {
                setIsMenuOpen(true);
              } else if (onMenuPress) {
                onMenuPress();
              }
            }}>
              <Feather
                name="more-vertical"
                size={20}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </Pressable>
          </View>
          
          {menuItems.length > 0 && (
            <ReactNativeMenuModal
              visible={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              triggerRef={menuTriggerRef}
              placement="top-left"
              offsetX={10}
              items={menuItems}
            />
          )}
        </HStack>
      </Box>

    </VStack>
  );
};

export default MessageDetailHeader;

