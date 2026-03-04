import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, Text, useToast } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { showCustomToast } from '@/src/components/CustomToast';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import { useUserReviews } from '@/src/features/profile/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { ProfileReview } from '@/src/features/profile/types';
import type { PostStackParamList } from '../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { ImageSourcePropType } from 'react-native';

type SelectExperienceForUpdateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SelectExperienceForUpdateScreenRouteProp = RouteProp<PostStackParamList, 'SelectExperienceForUpdateScreen'>;

/**
 * ID formatından review tipini kontrol et
 * @param id - Review ID
 * @returns true ise legacy review (UUID), false ise yeni sistem (ULID)
 */
const isLegacyReview = (id: string): boolean => {
  // UUID formatı: 36 karakter, tire içerir (8-4-4-4-12)
  return id.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const mapReviewToCardData = (item: ProfileReview): ExperiencePostCardData => {
  const avatarSource = item.user?.avatar ? toImageSource(item.user.avatar)! : DEFAULT_USER_AVATAR;
  const productImage = item.contextData?.image ? toImageSource(item.contextData.image) : undefined;
  const content: ExperiencePostCardContentItem[] = (item.content ?? []).map((entry) => ({
    tag: {
      icon: (entry.title?.toLowerCase().includes('product') || entry.title?.toLowerCase().includes('usage')) ? 'package' as const : 'tag' as const,
      title: entry.title,
    },
    text: entry.content,
    rating: Array(5).fill(false).map((_, index) => index < (entry.rating || 0)),
  }));
  return {
    id: item.id,
    user: {
      id: item.user?.id || '',
      name: item.user?.name || 'Unknown',
      title: item.user?.title || '',
      avatar: avatarSource,
      action: item.status === 'own' ? 'Added new product and experiences to inventory!' : undefined,
    },
    contextData: {
      id: item.contextData?.id || '',
      name: item.contextData?.name || '',
      subName: (item.contextData?.subName && !/^Status:\s*(tested|own)$/i.test(String(item.contextData.subName))) ? item.contextData.subName : '',
      image: productImage,
      isOwned: item.status === 'own' || item.contextData?.isOwned,
    },
    content,
    tags: item.tags?.slice(0, 3) ?? [],
    images: (item.images ?? []).map((img) => toImageSource(img)).filter((s): s is ImageSourcePropType => !!s),
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

export const mapReviewToExperiencePostParam = (item: ProfileReview): {
  id: string;
  content: Array<{ tag: { icon: string; title: string }; text: string; rating: boolean[] }>;
  images?: ImageSourcePropType[];
  product: { id: string; name: string; subName: string; image: any };
} => {
  const content = (item.content ?? []).map((entry) => ({
    tag: {
      icon: (entry.title?.toLowerCase().includes('product') || entry.title?.toLowerCase().includes('usage')) ? 'package' : 'tag',
      title: entry.title,
    },
    text: entry.content,
    rating: Array(5).fill(false).map((_, i) => i < (entry.rating || 0)),
  }));
  const productImage = item.contextData?.image ? toImageSource(item.contextData.image) : undefined;
  return {
    id: item.id,
    content,
    images: (item.images ?? []).map((uri) => toImageSource(uri)).filter((s): s is ImageSourcePropType => !!s),
    product: {
      id: item.contextData?.id || '',
      name: item.contextData?.name || '',
      subName: item.contextData?.subName || '',
      image: productImage,
    },
  };
};

export const SelectExperienceForUpdateScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('post');
  const navigation = useNavigation<SelectExperienceForUpdateScreenNavigationProp>();
  const route = useRoute<SelectExperienceForUpdateScreenRouteProp>();
  const { product } = route.params || {};
  const { user } = useAppStore();
  const userId = user?.id;
  const toast = useToast();

  const {
    data: reviewsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserReviews(userId, 20, { enabled: !!userId });

  const experienceItems = useMemo(() => {
    if (!reviewsData?.pages) return [];
    const items = reviewsData.pages.flatMap((page) => page.items ?? []);
    
    // Debug: İlk item'ın ID formatını kontrol et
    if (items.length > 0) {
      console.log('[SelectExperienceForUpdateScreen] 📊 First review item:', {
        id: items[0].id,
        idLength: items[0].id?.length,
        idFormat: items[0].id?.includes('-') ? 'UUID (with dashes)' : items[0].id?.length === 26 ? 'ULID (26 chars)' : 'Unknown',
        postId: items[0].postId,
        contentPostId: items[0].contentPostId,
        type: items[0].type,
      });
      console.log('[SelectExperienceForUpdateScreen] 📊 Total items loaded:', items.length);
      
      // Legacy items sayısını göster
      const legacyCount = items.filter(item => isLegacyReview(item.id)).length;
      console.log('[SelectExperienceForUpdateScreen] 📊 Legacy reviews:', legacyCount, '/', items.length);
    }
    
    return items;
  }, [reviewsData]);

  const mappedItems = useMemo(() => experienceItems.map(mapReviewToCardData), [experienceItems]);
  const isLoadingMoreRef = useRef(false);
  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [mappedItems.length]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasNextPage || isFetchingNextPage) return;
    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      setTimeout(() => { isLoadingMoreRef.current = false; }, 1000);
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectExperience = useCallback(
    (item: ProfileReview, toast: any) => {
      // Backend hint: "experiencePostId must be the experience post id (ULID, 26 chars)"
      // item.id UUID (bookmark ID) olabilir, postId veya contentPostId varsa onu kullan
      const experiencePostId = item.postId || item.contentPostId || item.id;
      
      // Legacy review kontrolü (UUID formatında ID)
      const isLegacy = isLegacyReview(experiencePostId);
      
      console.log('[SelectExperienceForUpdateScreen] 🔍 Selected experience item:', {
        itemId: item.id,
        itemIdLength: item.id?.length,
        itemIdFormat: item.id?.includes('-') ? 'UUID (with dashes)' : item.id?.length === 26 ? 'ULID (26 chars)' : 'Unknown',
        postId: item.postId,
        contentPostId: item.contentPostId,
        selectedExperiencePostId: experiencePostId,
        selectedIdLength: experiencePostId?.length,
        selectedIdFormat: experiencePostId?.includes('-') ? 'UUID (with dashes)' : experiencePostId?.length === 26 ? 'ULID (26 chars)' : 'Unknown',
        type: item.type,
        isLegacyReview: isLegacy,
      });
      
      // Legacy review için uyarı göster
      if (isLegacy) {
        showCustomToast(toast, {
          title: t('selectExperience.legacyWarning.toast.title'),
          description: t('selectExperience.legacyWarning.toast.description'),
          action: 'error',
        });
        return;
      }
      
      const experiencePostParam = mapReviewToExperiencePostParam(item);
      (navigation as any).navigate('CreateUpdatePostScreen', {
        product: product ? {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image,
          brand: product.brand,
        } : undefined,
        experiencePostId: experiencePostId,
        experiencePost: experiencePostParam,
      });
    },
    [navigation, product]
  );

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('App', {
        screen: 'MainTabs',
        params: { screen: 'FeedStack', params: { screen: 'FeedScreen' } },
      } as any);
    }
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ExperiencePostCardData }) => {
      const isLegacy = isLegacyReview(item.id);
      return (
        <Box px="$4" pb="$3">
          <ExperiencePostCard
            data={item}
            isDetailMode={false}
            onCardPress={() => {
              const raw = experienceItems.find((r) => r.id === item.id);
              if (raw) handleSelectExperience(raw, toast);
            }}
          />
          {isLegacy && (
            <Box
              mt="$2"
              px="$3"
              py="$2"
              bg={isDark ? '$yellow900' : '$yellow100'}
              borderRadius={8}
              borderWidth={1}
              borderColor={isDark ? '$yellow700' : '$yellow300'}
            >
              <Text
                fontSize="$xs"
                color={isDark ? '$yellow200' : '$yellow800'}
              >
                {t('selectExperience.legacyWarning.badge')}
              </Text>
            </Box>
          )}
        </Box>
      );
    },
    [experienceItems, handleSelectExperience, toast, isDark]
  );

  const keyExtractor = useCallback((item: ExperiencePostCardData) => item.id, []);
  const ListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextPage, isDark]);

  if (!userId) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'} px="$4" py="$4">
          <Header title={t('selectExperience.header.title')} leftAction="cancel" onLeftActionPress={handleBackPress} />
          <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
            {t('selectExperience.noUser.message')}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
        <Header
          title={t('selectExperience.header.title')}
          leftAction="cancel"
          onLeftActionPress={handleBackPress}
        />
        {isLoading && !reviewsData?.pages?.[0] ? (
          <VStack flex={1} justifyContent="center" alignItems="center" px="$4">
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
              {t('selectExperience.loading.message')}
            </Text>
          </VStack>
        ) : error ? (
          <VStack flex={1} justifyContent="center" alignItems="center" px="$4">
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
              {t('selectExperience.error.message')}
            </Text>
          </VStack>
        ) : mappedItems.length === 0 ? (
          <VStack flex={1} justifyContent="center" alignItems="center" px="$4">
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" textAlign="center">
              {t('selectExperience.empty.message')}
            </Text>
          </VStack>
        ) : (
          <FlatList
            data={mappedItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={ListFooter}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>
    </SafeAreaView>
  );
};
