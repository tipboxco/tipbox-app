import React, { useState, useRef, useMemo } from 'react';
import { Alert, View, Pressable as RNPressable } from 'react-native';
import {
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Box, 
    Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useRemoveFromTrustList } from '../../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { DEFAULT_USER_AVATAR } from '@/src/utils';
import { ReactNativeMenuModal, MenuItem } from '@/src/components/ReactNativeMenuModal';

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
  isPopoverOpen?: boolean; // Deprecated, kept for backward compatibility
  onPopoverOpen?: () => void; // Deprecated, kept for backward compatibility
  onPopoverClose?: () => void; // Deprecated, kept for backward compatibility
  onUserPress?: () => void;
}

export const TrustUserCard = ({
  user,
  showBorder = false,
  isPopoverOpen,
  onPopoverOpen,
  onPopoverClose,
  onUserPress,
}: TrustUserCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getTrustColor = (level: number) => {
    const colors = ['#CE4A4A', '#FF6B35', '#FFA500', '#32CD32', '#00BFFF'];
    return colors[level - 1] || colors[0];
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? Blocked users cannot interact with you.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // TODO: Block user API endpoint eklendiğinde buraya entegre edilecek
            console.log('[TrustUserCard] Block user:', user.id);
          },
        },
      ]
    );
  };

  const handleRemoveFromTrustList = () => {
    Alert.alert(
      'Remove from Trust List',
      `Are you sure you want to remove ${user.name} from your trust list?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            untrustUser(user.id);
          },
        },
      ]
    );
  };

  const handleMute = () => {
    // TODO: Mute functionality eklendiğinde buraya entegre edilecek
    console.log('[TrustUserCard] Mute user:', user.id);
  };

  // Menu items
  const menuItems = useMemo<MenuItem[]>(() => {
    const iconColor = isDark ? '#fff' : '#000';
    const items: MenuItem[] = [];
    
    if (handleRemoveFromTrustList) {
      items.push({
        label: 'Remove from Trust List',
        icon: <XCircleIcon width={20} height={20} color={iconColor} />,
        onPress: handleRemoveFromTrustList,
      });
    }
    
    if (handleMute) {
      items.push({
        label: 'Mute',
        icon: <BellIcon width={20} height={20} color={iconColor} />,
        onPress: handleMute,
      });
    }
    
    if (handleBlock) {
      items.push({
        label: 'Block',
        icon: <XCircleIcon width={20} height={20} color="#FF3040" />,
        onPress: handleBlock,
        color: '#FF3040',
      });
    }
    
    return items;
  }, [isDark, handleRemoveFromTrustList, handleMute, handleBlock]);

  const avatarSource =
    user.avatar ??
    DEFAULT_USER_AVATAR;

  return (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      py={12}
      px={16}
      borderBottomWidth={showBorder ? 1 : 0}
      borderBottomColor={isDark ? '#333' : '#E9E9E9'}
      position="relative"
      overflow="visible"
    >
      {/* User Info - Pressable */}
      <Pressable 
        flex={1}
        onPress={onUserPress}
        flexDirection="row"
        alignItems="center"
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
              fontSize="$sm"
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {user.name}
            </Text>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$xs"
              numberOfLines={1}
            >
              {user.title}
            </Text>
          </VStack>
        </HStack>
      </Pressable>

      {/* Context Menu - More Icon */}
      <Pressable onPress={() => setIsMenuOpen(true)}>
        <Box p={8}>
          <Feather
            name="more-horizontal"
            size={24}
            color={isDark ? '#959595' : '#959595'}
          />
        </Box>
      </Pressable>

      {/* Menu Modal */}
      <ReactNativeMenuModal
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={menuItems}
        position={{ top: 0, right: 16 }}
        width={200}
      />
    </HStack>
  );
};

export default TrustUserCard;
