import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Alert, View, Pressable as RNPressable, Modal, Dimensions, StyleSheet } from 'react-native';
import {
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Box, 
    Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { XCircleIcon, BellIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useRemoveFromTrustList, useBlockUser, useUnblockUser, useMuteUser, useUnmuteUser, useUserProfile } from '../../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { DEFAULT_USER_AVATAR } from '@/src/utils';

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
  isBlocked?: boolean; // Kullanıcı engellenmiş mi?
  isMuted?: boolean; // Kullanıcı sessize alınmış mı?
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
  const { user: currentUser } = useAppStore();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
  const { mutate: muteUser, isPending: isMuting } = useMuteUser();
  const { mutate: unmuteUser, isPending: isUnmuting } = useUnmuteUser();
  
  // User profile'ı çek (block/mute durumunu öğrenmek için)
  const { data: userProfile } = useUserProfile(user.id);
  
  // Block ve mute durumlarını belirle (profile'dan veya prop'tan)
  const isBlocked = userProfile?.isBlocked ?? user.isBlocked ?? false;
  const isMuted = userProfile?.isMuted ?? user.isMuted ?? false;
  
  // Error handling için mutation options
  const handleUntrustError = (error: any) => {
    console.error('[TrustUserCard] Untrust error:', error);
    const errorMessage = error?.response?.data?.message 
      || error?.message 
      || (error?.message === 'Network Error' ? 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.' : 'Kullanıcı trust listesinden kaldırılırken bir hata oluştu.');
    Alert.alert('Hata', errorMessage);
  };
  
  const handleBlockError = (error: any) => {
    console.error('[TrustUserCard] Block error:', error);
    const errorMessage = error?.response?.data?.message 
      || error?.message 
      || (error?.message === 'Network Error' ? 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.' : 'Kullanıcı engellenirken bir hata oluştu.');
    Alert.alert('Hata', errorMessage);
  };
  
  const handleMuteError = (error: any) => {
    console.error('[TrustUserCard] Mute error:', error);
    const errorMessage = error?.response?.data?.message 
      || error?.message 
      || (error?.message === 'Network Error' ? 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.' : 'Kullanıcı sessize alınırken bir hata oluştu.');
    Alert.alert('Hata', errorMessage);
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerPositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const getTrustColor = (level: number) => {
    const colors = ['#CE4A4A', '#FF6B35', '#FFA500', '#32CD32', '#00BFFF'];
    return colors[level - 1] || colors[0];
  };

  const handleBlock = () => {
    if (!currentUser?.id) return;
    
    if (isBlocked) {
      // Unblock
      Alert.alert(
        'Unblock User',
        `Are you sure you want to unblock ${user.name}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unblock',
            style: 'default',
            onPress: () => {
              unblockUser(
                { userId: currentUser.id, targetUserId: user.id },
                {
                  onError: handleBlockError,
                }
              );
            },
          },
        ]
      );
    } else {
      // Block
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${user.name}? Blocked users cannot interact with you.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Block',
            style: 'destructive',
            onPress: () => {
              blockUser(
                { userId: currentUser.id, targetUserId: user.id },
                {
                  onError: handleBlockError,
                }
              );
            },
          },
        ]
      );
    }
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
            untrustUser(user.id, {
              onError: handleUntrustError,
            });
          },
        },
      ]
    );
  };

  const handleMute = () => {
    if (!currentUser?.id) return;
    
    if (isMuted) {
      // Unmute
      unmuteUser(
        { userId: currentUser.id, targetUserId: user.id },
        {
          onError: handleMuteError,
        }
      );
    } else {
      // Mute
      muteUser(
        { userId: currentUser.id, targetUserId: user.id },
        {
          onError: handleMuteError,
        }
      );
    }
  };

  // Calculate menu position - QuestionPostCard gibi
  const handleMenuOpen = useCallback((event?: any) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const menuWidth = 160;
    const menuHeight = 140; // 3 item için yaklaşık yükseklik
    
    const calculatePosition = (x: number, y: number, width: number, height: number) => {
      // Menu'yu trigger button'ın sağında konumlandır
      let left = x + width - menuWidth - 20;
      let top = y + height - 16;
      
      // Ekran sınırları kontrolü
      if (left < 12) {
        left = 12;
      }
      if (left + menuWidth > screenWidth - 12) {
        left = screenWidth - menuWidth - 12;
      }
      if (top < 12) {
        top = 12;
      }
      if (top + menuHeight > screenHeight - 12) {
        // Eğer altında yer yoksa, üstünde göster
        top = y - menuHeight - 8;
        if (top < 12) {
          top = 12;
        }
      }
      
      return { top, left };
    };

    // ÖNCELİK 1: Event'ten gelen koordinatları kullan
    if (event?.nativeEvent?.pageX !== undefined && event?.nativeEvent?.pageY !== undefined) {
      const pageX = event.nativeEvent.pageX;
      const pageY = event.nativeEvent.pageY;
      
      const triggerWidth = 44;
      const triggerHeight = 44;
      
      const triggerX = pageX - triggerWidth / 2;
      const triggerY = pageY - triggerHeight / 2;
      
      const position = calculatePosition(triggerX, triggerY, triggerWidth, triggerHeight);
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 2: Stored position'ı kullan
    if (triggerPositionRef.current) {
      const stored = triggerPositionRef.current;
      const position = calculatePosition(stored.x, stored.y, stored.width, stored.height);
      setMenuPosition(position);
      setIsMenuOpen(true);
      return;
    }

    // ÖNCELİK 3: measureInWindow ile ölç
    if (menuTriggerRef.current) {
      menuTriggerRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0 && x >= 0 && y >= 0) {
          triggerPositionRef.current = { x, y, width, height };
          const position = calculatePosition(x, y, width, height);
          setMenuPosition(position);
          setIsMenuOpen(true);
        } else {
          setMenuPosition({ top: 40, left: screenWidth - 172 });
          setIsMenuOpen(true);
        }
      });
    } else {
      setMenuPosition({ top: 40, left: screenWidth - 172 });
      setIsMenuOpen(true);
    }
  }, []);

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
      <View 
        ref={menuTriggerRef} 
        collapsable={false}
        onLayout={() => {
          if (menuTriggerRef.current) {
            menuTriggerRef.current.measureInWindow((x, y, width, height) => {
              if (width > 0 && height > 0) {
                triggerPositionRef.current = { x, y, width, height };
              }
            });
          }
        }}
      >
        <Pressable onPress={(event) => handleMenuOpen(event)}>
          <Box p={8}>
            <Feather
              name="more-horizontal"
              size={24}
              color={isDark ? '#959595' : '#959595'}
            />
          </Box>
        </Pressable>
      </View>

      {/* Menu Modal */}
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
        <View
          style={[
            styles.menuContainer,
            {
              top: menuPosition.top,
              left: menuPosition.left,
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              borderWidth: 1,
              borderColor: isDark ? '#333333' : '#E9E9E9',
              shadowOpacity: isDark ? 0.3 : 0.1,
            }
          ]}
        >
          <RNPressable 
            onPress={(e) => e.stopPropagation()}
            style={{ flex: 1 }}
          >
            <VStack width="100%">
              <RNPressable
                onPress={() => {
                  setIsMenuOpen(false);
                  handleRemoveFromTrustList();
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <HStack alignItems="center" space="xs">
                  <XCircleIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$sm"
                    fontWeight="$medium"
                  >
                    Remove from Trust List
                  </Text>
                </HStack>
              </RNPressable>
              <View style={{ height: 1, backgroundColor: isDark ? '#333333' : '#E9E9E9' }} />
              <RNPressable
                onPress={() => {
                  setIsMenuOpen(false);
                  handleMute();
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                disabled={isMuting || isUnmuting}
              >
                <HStack alignItems="center" space="xs">
                  <BellIcon width={18} height={18} color={isDark ? '#fff' : '#000'} />
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$sm"
                    fontWeight="$medium"
                  >
                    {isMuting || isUnmuting ? (isMuted ? 'Unmuting...' : 'Muting...') : (isMuted ? 'Unmute' : 'Mute')}
                  </Text>
                </HStack>
              </RNPressable>
              <View style={{ height: 1, backgroundColor: isDark ? '#333333' : '#E9E9E9' }} />
              <RNPressable
                onPress={() => {
                  setIsMenuOpen(false);
                  handleBlock();
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                disabled={isBlocking || isUnblocking}
              >
                <HStack alignItems="center" space="xs">
                  <XCircleIcon width={18} height={18} color="#FF3040" />
                  <Text
                    color="#FF3040"
                    fontSize="$sm"
                    fontWeight="$medium"
                  >
                    {isBlocking || isUnblocking ? (isBlocked ? 'Unblocking...' : 'Blocking...') : (isBlocked ? 'Unblock' : 'Block')}
                  </Text>
                </HStack>
              </RNPressable>
            </VStack>
          </RNPressable>
        </View>
      </Modal>
    </HStack>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    width: 160,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
});

export default TrustUserCard;
