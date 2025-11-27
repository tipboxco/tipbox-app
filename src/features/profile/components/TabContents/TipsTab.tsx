import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useUserTipsAndTricks } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import { CardType } from '@/src/types/common';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { ProfileTipsAndTricks } from '../../types';

const mapTipsToCardData = (item: ProfileTipsAndTricks): TipsCardData => {
  const avatarSource = toImageSource(item.user.avatarUrl)!;

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

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack space="md" px={16} py={16}>
      {isLoading && (
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mb="$2">
          Tips & Tricks yükleniyor...
        </Text>
      )}

      {error && (
        <Text color="#CE4A4A" fontSize="$sm" mb="$2">
          Tips & Tricks yüklenirken bir hata oluştu: {error.message}
        </Text>
      )}

      {tips
        ?.filter((item) => item.type === CardType.TIPS_AND_TRICKS)
        .map((item) => (
          <TipsAndTricksPostCard key={item.id} data={mapTipsToCardData(item)} />
        ))}
    </VStack>
  );
};
export default TipsTab;