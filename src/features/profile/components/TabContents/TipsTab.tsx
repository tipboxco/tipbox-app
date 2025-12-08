import React, { useMemo } from 'react';
import { FlatList } from 'react-native';
import { VStack, Text } from '@gluestack-ui/themed';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useUserTipsAndTricks } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { ProfileTipsAndTricks } from '../../types';

const mapTipsToCardData = (item: ProfileTipsAndTricks): TipsCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;

  const product: TipsProduct = {
    id: item.contextData.id,
    name: item.contextData.name,
    subName: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
  };

  const category: TipsCategory = {
    id: item.contextData.id,
    name: item.contextData.name,
    subCategory: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
    product,
  };

  return {
    id: item.id,
    user: {
      id: item.user.id,
      name: item.user.name,
      title: item.user.title,
      avatar: avatarSource,
    },
    category,
    content: item.content,
    images:
      item.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
    stats: item.stats,
    tag: item.tag,
    createdAt: item.createdAt,
  };
};

export const TipsTab = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const {
    data: tips,
    isLoading,
    error,
  } = useUserTipsAndTricks(userId);

  const mappedTips = useMemo(() => {
    if (!tips) return [];
    return tips.map(mapTipsToCardData);
  }, [tips]);

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  if (isLoading) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Tips & Tricks yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Tips & Tricks yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedTips.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Henüz tips & tricks bulunmuyor.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedTips}
      renderItem={({ item }) => <TipsAndTricksPostCard data={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      removeClippedSubviews={true}
    />
  );
};
export default TipsTab;