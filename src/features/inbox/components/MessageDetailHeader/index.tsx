import React, { useState, useRef, useMemo, useCallback } from 'react';
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
import { Modal, Dimensions, Pressable as RNPressable } from 'react-native';
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Calculate menu position
  const handleMenuOpen = useCallback(() => {
    if (menuTriggerRef.current) {
      menuTriggerRef.current.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get('window').width;
        const menuWidth = 180;
        const left = Math.max(12, Math.min(x - menuWidth + 10, screenWidth - menuWidth - 12));
        const top = Math.max(12, y - 8);
        setMenuPosition({ top, left });
        setIsMenuOpen(true);
      });
    } else {
      setIsMenuOpen(true);
    }
  }, []);

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
        minHeight={56}
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
            {senderAvatar ? (
              <>
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
                  {senderTitle ? (
                    <Text
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                      fontSize={9}
                      fontWeight="$normal"
                      numberOfLines={1}
                    >
                      {senderTitle}
                    </Text>
                  ) : null}
                </VStack>
              </>
            ) : (
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={14}
                fontWeight="$semibold"
                numberOfLines={1}
              >
                {senderName}
              </Text>
            )}
          </HStack>

          {/* Menü Butonu */}
          <View ref={menuTriggerRef} collapsable={false}>
            <Pressable onPress={() => {
              if (recipientUserId) {
                handleMenuOpen();
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
          
          {recipientUserId && (
            <Modal
              visible={isMenuOpen}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setIsMenuOpen(false)}
            >
              <RNPressable
                style={{ flex: 1 }}
                onPress={() => setIsMenuOpen(false)}
              />
              <Box
                position="absolute"
                top={menuPosition.top}
                left={menuPosition.left}
                width={180}
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderRadius={16}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.25}
                shadowRadius={8}
                elevation={8}
                overflow="hidden"
              >
                <Pressable
                  onPress={() => {
                    setIsMenuOpen(false);
                    if (onShare) onShare();
                  }}
                  px={16}
                  py={12}
                >
                  <HStack alignItems="center" space="md">
                    <ArrowUpTrayIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize="$md"
                      fontWeight="$medium"
                    >
                      Share
                    </Text>
                  </HStack>
                </Pressable>
                <Box h={1} bg={isDark ? '#333333' : '#E9E9E9'} />
                <Pressable
                  onPress={() => {
                    setIsMenuOpen(false);
                    if (onReport) onReport();
                  }}
                  px={16}
                  py={12}
                >
                  <HStack alignItems="center" space="md">
                    <FlagIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize="$md"
                      fontWeight="$medium"
                    >
                      Report
                    </Text>
                  </HStack>
                </Pressable>
                <Box h={1} bg={isDark ? '#333333' : '#E9E9E9'} />
                <Pressable
                  onPress={() => {
                    setIsMenuOpen(false);
                    if (onBlock) onBlock();
                  }}
                  px={16}
                  py={12}
                >
                  <HStack alignItems="center" space="md">
                    <NoSymbolIcon width={20} height={20} color="#FF3040" />
                    <Text
                      color="#FF3040"
                      fontSize="$md"
                      fontWeight="$medium"
                    >
                      Block
                    </Text>
                  </HStack>
                </Pressable>
              </Box>
            </Modal>
          )}
        </HStack>
      </Box>

    </VStack>
  );
};

export default MessageDetailHeader;

