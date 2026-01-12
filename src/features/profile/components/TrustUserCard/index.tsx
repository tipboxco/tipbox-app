import React from 'react';
import { Alert } from 'react-native';
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
import { useReportUser, useRemoveFromTrustList } from '../../api/hooks';
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
}

interface TrustUserCardProps {
  user: TrustUserCardUser;
  showBorder?: boolean;
  isPopoverOpen: boolean;
  onPopoverOpen: () => void;
  onPopoverClose: () => void;
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
  const { mutate: reportUser, isPending: isReporting } = useReportUser();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();

  const getTrustColor = (level: number) => {
    const colors = ['#CE4A4A', '#FF6B35', '#FFA500', '#32CD32', '#00BFFF'];
    return colors[level - 1] || colors[0];
  };

  const handleBlock = () => {
    Alert.alert(
      'Kullanıcıyı Engelle',
      'Bu kullanıcıyı engellemek istediğinizden emin misiniz? Engellediğiniz kullanıcı sizinle etkileşime geçemez.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            // TODO: Block user API endpoint eklendiğinde buraya entegre edilecek
            console.log('[TrustUserCard] Block user:', user.id);
            onPopoverClose();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!currentUser?.id) return;
    
    Alert.alert(
      'Kullanıcıyı Raporla',
      'Bu kullanıcıyı raporlamak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Raporla',
          style: 'destructive',
          onPress: () => {
            reportUser({
              userId: currentUser.id,
              targetUserId: user.id,
              data: {
                category: 'OTHER',
                description: 'Kullanıcı trust listesinden raporlandı',
              },
            });
            onPopoverClose();
          },
        },
      ]
    );
  };

  const handleRemoveFromTrustList = () => {
    Alert.alert(
      'Trust Listesinden Kaldır',
      `${user.name} kullanıcısını trust listesinden kaldırmak istediğinizden emin misiniz?`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            untrustUser(user.id);
            onPopoverClose();
          },
        },
      ]
    );
  };

  const handleMute = () => {
    // TODO: Mute functionality eklendiğinde buraya entegre edilecek
    console.log('[TrustUserCard] Mute user:', user.id);
    onPopoverClose();
  };

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
    >
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
      </Pressable>

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
          bg={isDark ? '#1A1A1A' : '#FAFAFA'}
          borderRadius={5}
        >
          <PopoverArrow />
          <PopoverBody p={0}>
            <VStack>
              {/* Mute Option */}
              <Pressable
                onPress={handleMute}
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
                onPress={handleBlock}
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
                      name="slash"
                      size={16}
                      color="#FF3040"
                    />
                  </Box>
                  <Text
                    color="#FF3040"
                    fontSize={11}
                    fontWeight="$medium"
                  >
                    Block
                  </Text>
                </HStack>
              </Pressable>

              {/* Report Option */}
              <Pressable
                onPress={handleReport}
                p={12}
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
                disabled={isReporting}
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
                      name="flag"
                      size={16}
                      color={isDark ? '#fff' : '#000'}
                    />
                  </Box>
                  <Text
                    color={isDark ? '#fff' : '#2F2F2F'}
                    fontSize={11}
                    fontWeight="$medium"
                  >
                    {isReporting ? 'Raporlanıyor...' : 'Raporla'}
                  </Text>
                </HStack>
              </Pressable>

              {/* Remove from Trust List Option */}
              <Pressable
                onPress={handleRemoveFromTrustList}
                p={12}
                disabled={isUntrusting}
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
                      name="user-x"
                      size={16}
                      color={isDark ? '#fff' : '#000'}
                    />
                  </Box>
                  <Text
                    color={isDark ? '#fff' : '#2F2F2F'}
                    fontSize={11}
                    fontWeight="$medium"
                  >
                    {isUntrusting ? 'Kaldırılıyor...' : 'Remove from Trust List'}
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
