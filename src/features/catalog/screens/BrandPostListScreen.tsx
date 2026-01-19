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
      // BrandFeedResponse'da posts array'i var
      const pagePosts = page.posts || [];
      pagePosts.forEach((item: BrandFeedPost) => {
        // Sadece 'post' type'ını PostCard olarak göster
        if (item.type !== 'post') {
          return; // Experience, Benchmark, Tips, Question gibi diğer type'ları atla
        }
        
        const postData = item.data as import('@/src/features/profile/types').ProfilePost;
        if (!postData?.id || !postData?.user?.id) {
          return; // Geçersiz post'ları atla
        }
        
        const avatarSource = toImageSource(postData.user.avatar) || require('@/assets/avatar/default-useravatar.png');
        
        // content array ise string'e çevir
        const contentString = Array.isArray(postData.content)
          ? postData.content.map((item) => item?.content || '').join(' ')
          : (postData.content || '');
        
        // images array'i boşsa veya görseller yüklenemediyse default görsel ekle
        const defaultPostImage = require('@/assets/defaultImages/default-post.png');
        const mappedImages = postData.images
          ?.map((img: string) => toImageSource(img))
          .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
        const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];
        
        // contextData.image için güvenli mapping
        const defaultProductImage = require('@/assets/product/product_01.png');
        let contextImage: any = defaultProductImage;
        if (postData.contextData?.image) {
          const mappedContextImage = toImageSource(postData.contextData.image);
          if (mappedContextImage) {
            contextImage = mappedContextImage;
          } else {
            console.warn('[BrandPostListScreen] Failed to map contextData.image:', {
              postId: postData.id,
              contextDataId: postData.contextData?.id,
              contextDataName: postData.contextData?.name,
              originalImage: postData.contextData.image,
              imageType: typeof postData.contextData.image,
            });
          }
        }
        
        // Log contextData bilgileri
        if (postData.contextData) {
          console.log('[BrandPostListScreen] Post with contextData:', {
            postId: postData.id,
            contextType: postData.contextType,
            contextData: {
              id: postData.contextData.id,
              name: postData.contextData.name,
              subName: postData.contextData.subName,
              image: postData.contextData.image,
              imageType: typeof postData.contextData.image,
              mappedImage: contextImage,
            },
          });
        }
        
        const postCard: PostCardData = {
          id: postData.id,
          type: 'post' as CardType,
          user: {
            id: postData.user.id,
            name: postData.user.name || '',
            title: postData.user.title || '',
            avatar: avatarSource,
          },
          content: contentString,
          images,
          stats: {
            likes: postData.stats?.likes || 0,
            comments: postData.stats?.comments || 0,
            shares: postData.stats?.shares || 0,
            bookmarks: postData.stats?.bookmarks || 0,
          },
          createdAt: postData.createdAt || new Date().toISOString(),
          contextType: postData.contextType,
          contextData: postData.contextData ? {
            id: postData.contextData.id,
            name: postData.contextData.name || '',
            subName: postData.contextData.subName || '',
            image: contextImage, // Her zaman geçerli bir image source
            isOwned: postData.contextData.isOwned || false,
          } : undefined,
        };
        allPosts.push(postCard);
      });
    });
    return allPosts;
  }, [feedData]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Posts"
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
                <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                  Loading posts...
                </Text>
              </VStack>
            ) : posts.length === 0 ? (
              <VStack alignItems="center" py="$8">
                <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
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

export default BrandPostListScreen;
