import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList } from 'react-native';
import { VStack, HStack, Text, Pressable, Box, Image } from '@gluestack-ui/themed';
import { ChevronLeftIcon, UsersIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from '@/src/hooks/useTranslation';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useTrusterList } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { Header } from '@/src/components/Header';
import type { WalletStackParamList } from '../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SelectFriendScreenRouteProp = RouteProp<WalletStackParamList, 'SelectFriendScreen'>;
type SelectFriendScreenNavigationProp = NativeStackNavigationProp<WalletStackParamList, 'SelectFriendScreen'>;

export const SelectFriendScreen: React.FC = () => {
  const { t } = useTranslation('wallet');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SelectFriendScreenNavigationProp>();
  const route = useRoute<SelectFriendScreenRouteProp>();
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

    // Call the callback from route params
    route.params?.onSelect?.(friendData);

    // Navigate back
    navigation.goBack();
  };

  // Render each truster item
  const renderTrusterItem = ({ item: truster }: { item: any }) => (
    <Pressable onPress={() => handleTrusterSelect(truster)}>
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
  );

  // Empty state component
  const ListEmptyComponent = () => (
    <VStack alignItems="center" justifyContent="center" py="$8" px="$4">
      <UsersIcon width={64} height={64} color={isDark ? '#666666' : '#CCCCCC'} />
      <Text fontSize={16} fontWeight="$bold" color="$textLight500" $dark-color="$textDark400" mt="$4">
        {t('selectFriend.noFriendsTitle')}
      </Text>
      <Text fontSize={12} color="$textLight400" $dark-color="$textDark500" mt="$2" textAlign="center">
        {t('selectFriend.noFriendsMessage')}
      </Text>
    </VStack>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
      edges={['top']}
    >
      {/* Header */}
      <Header
        title={t('header.selectFriend')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Content */}
      <VStack flex={1} px="$4" pt="$2">
        {isLoadingTrusters ? (
          <VStack alignItems="center" justifyContent="center" flex={1}>
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" mt="$4">
              {t('selectFriend.loading')}
            </Text>
          </VStack>
        ) : (
          <FlatList
            data={trusterList || []}
            renderItem={renderTrusterItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={ListEmptyComponent}
          />
        )}
      </VStack>
    </SafeAreaView>
  );
};
