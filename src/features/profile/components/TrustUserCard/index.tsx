import React from 'react';
import {
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Box, 
    Image,
    Popover,
    PopoverBackdrop,
    PopoverContent,
    PopoverBody,
    PopoverArrow
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

export interface TrustUserCardUser {
  id: string;
  name: string;
  title: string;
  /**
   * React Native Image source
   * null/undefined olabilir, bu durumda placeholder gosterilir.
   */
  avatar?: any;
  trustLevel: number; // 1-5
  isOnline?: boolean;
}

interface TrustUserCardProps {
  user: TrustUserCardUser;
  showBorder?: boolean;
  isPopoverOpen: boolean;
  onPopoverOpen: () => void;
  onPopoverClose: () => void;
}

export const TrustUserCard = ({
  user,
  showBorder = false,
  isPopoverOpen,
  onPopoverOpen,
  onPopoverClose,
}: TrustUserCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const getTrustColor = (level: number) => {
    const colors = ['#CE4A4A', '#FF6B35', '#FFA500', '#32CD32', '#00BFFF'];
    return colors[level - 1] || colors[0];
  };

  const handleAction = (action: string) => {
    console.log(`${action} clicked for user:`, user.name);
    onPopoverClose();
  };

  const avatarSource =
    user.avatar ??
    require('@/assets/avatar/ozan.png');

  return (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      py={12}
      px={16}
      borderBottomWidth={showBorder ? 1 : 0}
      borderBottomColor={isDark ? '#333' : '#E9E9E9'}
    >
      <HStack alignItems="center" space="md" flex={1}>
        {/* Avatar with Trust Level Ring */}
        <Box position="relative">
          <Box
            width={54}
            height={54}
            borderRadius={100}
            bg={getTrustColor(user.trustLevel)}
            alignItems="center"
            justifyContent="center"
          >
            <Box
              width={50}
              height={50}
              borderRadius={23}
              overflow="hidden"
            >
              <Image
                source={avatarSource}
                alt={user.name}
                width={50}
                height={50}
                resizeMode="cover"
              />
            </Box>
          </Box>
        </Box>

        {/* User Info */}
        <VStack space="xs" maxWidth={180}>
          <Text
            color={isDark ? '#fff' : '#000'}
            fontSize={11}
            fontWeight="$semibold"
            numberOfLines={1}
          >
            {user.name}
          </Text>
          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize={9}
            numberOfLines={1}
            lineHeight={11}
          >
            {user.title}
          </Text>
        </VStack>
      </HStack>

      {/* More Options Popover */}
      <Popover
        isOpen={isPopoverOpen}
        onClose={onPopoverClose}
        placement="left"
        trigger={(triggerProps) => (
          <Pressable
            {...triggerProps}
            p={8}
            onPress={(e) => {
              // gluestack'in kendi tetikleyicisini de çalıştır
              (triggerProps as any)?.onPress?.(e);
              onPopoverOpen();
            }}
          >
            <Feather
              name="more-horizontal"
              size={24}
              color={isDark ? '#959595' : '#959595'}
            />
          </Pressable>
        )}
      >
        <PopoverBackdrop onPress={onPopoverClose} />
        <PopoverContent
          width={190}
          height={160}
          bg={isDark ? '#1A1A1A' : '#FAFAFA'}
          borderRadius={5}
        >
          <PopoverArrow />
          <PopoverBody p={0}>
            <VStack space="xs">
              {/* Mute Option */}
              <Pressable
                onPress={() => handleAction('Mute')}
                p={12}
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
              >
                <HStack alignItems="center" space="sm">
                  <Box
                    width={22}
                    height={22}
                    bg={isDark ? '#333' : '#FFFFFF'}
                    borderRadius={11}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Feather
                      name="bell-off"
                      size={16}
                      color={isDark ? '#fff' : '#000'}
                    />
                  </Box>
                  <Text
                    color={isDark ? '#fff' : '#2F2F2F'}
                    fontSize={11}
                    fontWeight="$medium"
                  >
                    Mute
                  </Text>
                </HStack>
              </Pressable>

              {/* Block Option */}
              <Pressable
                onPress={() => handleAction('Block')}
                p={12}
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
              >
                <HStack alignItems="center" space="sm">
                  <Box
                    width={22}
                    height={22}
                    bg={isDark ? '#333' : '#FFFFFF'}
                    borderRadius={11}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Feather
                      name="x-circle"
                      size={16}
                      color={isDark ? '#fff' : '#000'}
                    />
                  </Box>
                  <Text
                    color={isDark ? '#fff' : '#2F2F2F'}
                    fontSize={11}
                    fontWeight="$medium"
                  >
                    Block
                  </Text>
                </HStack>
              </Pressable>

              {/* Remove from Trust List Option */}
              <Pressable
                onPress={() => handleAction('Remove from Trust List')}
                p={12}
              >
                <HStack alignItems="center" space="sm">
                  <Box
                    width={22}
                    height={22}
                    bg={isDark ? '#333' : '#FFFFFF'}
                    borderRadius={11}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Feather
                      name="x-circle"
                      size={16}
                      color={isDark ? '#fff' : '#000'}
                    />
                  </Box>
                  <Text
                    color={isDark ? '#fff' : '#2F2F2F'}
                    fontSize={11}
                    fontWeight="$medium"
                  >
                    Remove from Trust List
                  </Text>
                </HStack>
              </Pressable>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </HStack>
  );
};

export default TrustUserCard;
