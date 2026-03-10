import React from 'react';
import { VStack, HStack, Text, Pressable, Box, Image } from '@gluestack-ui/themed';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { XMarkIcon, UsersIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useTrusterList } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';

export interface SelectFriendBottomSheetProps {
  onClose: () => void;
  onSelect: (friendData: {
    id: string;
    name: string;
    title?: string;
    bio?: string;
    avatar: any;
  }) => void;
}

export const SelectFriendBottomSheet: React.FC<SelectFriendBottomSheetProps> = ({
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation('wallet');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const user = useAppStore((state) => state.user);

  // Fetch Truster List
  const { data: trusterList, isLoading: isLoadingTrusters } = useTrusterList(user?.id);

  // Handle truster selection
  const handleTrusterSelect = (truster: any) => {
    const friendData = {
      id: truster.id,
      name: truster.name,
      title: truster.titles?.[0],
      bio: truster.userName,
      avatar: truster.avatar,
    };

    onSelect(friendData);
    onClose();
  };

  return (
    <VStack bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} borderTopLeftRadius={20} borderTopRightRadius={20} pb="$4">
      {/* Header */}
      <HStack
        justifyContent="space-between"
        alignItems="center"
        px="$4"
        py="$4"
        borderBottomWidth={1}
        borderBottomColor={isDark ? '$borderDark700' : '$borderLight200'}
      >
        <Text fontSize={18} fontWeight="$bold" color={isDark ? '$textDark50' : '$textLight900'}>
          {t('header.selectFriend')}
        </Text>
        <Pressable onPress={onClose}>
          <XMarkIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
      </HStack>

      {/* Content */}
      <VStack flex={1} px="$4" pt="$2">
        {isLoadingTrusters ? (
          <VStack alignItems="center" justifyContent="center" py="$12">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" mt="$4">
              {t('selectFriend.loading')}
            </Text>
          </VStack>
        ) : !trusterList || trusterList.length === 0 ? (
          <VStack alignItems="center" justifyContent="center" py="$8" px="$4">
            <UsersIcon width={64} height={64} color={isDark ? '#666666' : '#CCCCCC'} />
            <Text fontSize={16} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400" mt="$4">
              {t('selectFriend.noFriendsTitle')}
            </Text>
            <Text fontSize={12} color="$textLight400" $dark-color="$textDark500" mt="$2" textAlign="center">
              {t('selectFriend.noFriendsMessage')}
            </Text>
          </VStack>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {trusterList.map((truster: any) => (
              <Pressable key={truster.id} onPress={() => handleTrusterSelect(truster)}>
                <Box
                  bg="$backgroundLight0"
                  $dark-bg="$backgroundDark800"
                  borderWidth={1}
                  borderColor="$borderLight200"
                  $dark-borderColor="$borderDark600"
                  rounded={10}
                  p="$4"
                  mb="$3"
                >
                  <HStack space="md" alignItems="center">
                    <Box w={48} h={48} rounded="$full" overflow="hidden" bg="$backgroundLight200" $dark-bg="$backgroundDark700">
                      <Image
                        source={toImageSource(truster.avatar) || DEFAULT_USER_AVATAR}
                        alt={truster.name}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                      />
                    </Box>

                    <VStack flex={1} space="xs">
                      <Text
                        fontSize={14}
                        fontWeight="$bold"
                        color="$textLight900"
                        $dark-color="$textDark50"
                      >
                        {truster.name}
                      </Text>
                      <Text
                        fontSize={12}
                        color="$textLight500"
                        $dark-color="$textDark400"
                      >
                        @{truster.userName}
                      </Text>
                      {truster.titles && truster.titles.length > 0 && (
                        <Text
                          fontSize={11}
                          color="$textLight400"
                          $dark-color="$textDark500"
                        >
                          {truster.titles[0]}
                        </Text>
                      )}
                    </VStack>

                    {truster.isTrusted && (
                      <Box bg="#C2E607" rounded={6} px="$2" py="$1">
                        <Text fontSize={10} fontWeight="$bold" color="#111111">{t('selectFriend.trusted')}</Text>
                      </Box>
                    )}
                  </HStack>
                </Box>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </VStack>
    </VStack>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 16,
  },
});

SelectFriendBottomSheet.displayName = 'SelectFriendBottomSheet';
