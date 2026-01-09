import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, ActivityIndicator, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import PostCard from '@/src/components/PostCards/PostCard';
import { useSafeAreaValues } from '@/src/utils';
import { useBrandFeed } from '../api/hooks';
import type { BrandFeedPost } from '../types';
import type { PostCardData } from '@/src/types/PostCard';
import { CardType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';

type BrandPostListScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandPostListScreen'>;
type BrandPostListScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandPostListScreen'>;

const BrandPostListScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandPostListScreenNavigationProp>();
  const route = useRoute<BrandPostListScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');
  
  const { brandId } = route.params;

  // API hook
  const { data: feedData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandFeed(brandId, 20);

  // Transform API feed data to PostCard format
  const posts = useMemo(() => {
    if (!feedData?.pages) {
      return [];
    }
    const allPosts: PostCardData[] = [];
    feedData.pages.forEach((page) => {
      if (page.items) {
        page.items.forEach((item: BrandFeedPost) => {
          const postCard: PostCardData = {
            id: item.id,
            type: item.type as CardType,
            user: {
              id: item.user?.id || '',
              name: item.user?.name || '',
              avatar: item.user?.avatar || null,
            },
            content: item.content || '',
            images: item.images || [],
            stats: {
              likes: item.stats?.likes || 0,
              comments: item.stats?.comments || 0,
              shares: item.stats?.shares || 0,
            },
            createdAt: item.createdAt || new Date().toISOString(),
            product: item.product ? {
              id: item.product.id,
              name: item.product.name,
              image: item.product.image,
            } : undefined,
          };
          allPosts.push(postCard);
        });
      }
    });
    return allPosts;
  }, [feedData]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Paylaşımlar"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={400}
        >
          <VStack space="md" p="$4">
            {isLoading ? (
              <VStack alignItems="center" py="$8">
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                  Loading posts...
                </Text>
              </VStack>
            ) : posts.length === 0 ? (
              <VStack alignItems="center" py="$8">
                <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                  No posts found
                </Text>
              </VStack>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} data={post} hideProduct={true} />
                ))}
                {isFetchingNextPage && (
                  <VStack alignItems="center" py="$4">
                    <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  </VStack>
                )}
              </>
            )}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

BrandPostListScreen.displayName = 'BrandPostListScreen';

export default BrandPostListScreen;
