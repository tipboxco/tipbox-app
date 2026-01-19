import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { BookOpenIcon, HeartIcon, ShareIcon } from 'react-native-heroicons/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon, BookmarkIcon as BookmarkSolidIcon } from 'react-native-heroicons/solid';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { 
  useNewsDetail, 
  useBrandProductNewsDetail,
  useLikeNews,
  useUnlikeNews,
  useFavoriteNews,
  useUnfavoriteNews,
  useShareNews,
} from '../api/hooks';

type NewsDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'NewsDetailScreen'>;
type NewsDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'NewsDetailScreen'>;

const NewsDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const route = useRoute<NewsDetailScreenRouteProp>();
  const bottomInset = useSafeAreaValues('bottom');

  const { newsId, brandId, productId } = route.params;

  // API hook - brandId ve productId varsa brand product news detail, yoksa normal news detail
  const newsDetailQuery = brandId && productId
    ? useBrandProductNewsDetail(brandId, productId, newsId)
    : useNewsDetail(newsId);
  
  const { data: newsDetail, isLoading, error } = newsDetailQuery;

  // Interaction state
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  // Sync with newsDetail
  useEffect(() => {
    if (newsDetail) {
      setIsLiked(newsDetail.isLiked || false);
      setIsFavorited(newsDetail.isFavorited || false);
      setIsShared(newsDetail.isShared || false);
      setLikesCount(newsDetail.likesCount || 0);
      setCommentsCount(newsDetail.commentsCount || 0);
      setSharesCount(newsDetail.sharesCount || 0);
      setFavoritesCount(newsDetail.favoritesCount || 0);
      setViewsCount(newsDetail.viewsCount || 0);
    }
  }, [newsDetail]);

  // Mutation hooks
  const likeNewsMutation = useLikeNews();
  const unlikeNewsMutation = useUnlikeNews();
  const favoriteNewsMutation = useFavoriteNews();
  const unfavoriteNewsMutation = useUnfavoriteNews();
  const shareNewsMutation = useShareNews();

  // Handlers
  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      unlikeNewsMutation.mutate({ newsId, brandId, productId });
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      likeNewsMutation.mutate({ newsId, brandId, productId });
    }
  };

  const handleFavorite = () => {
    if (isFavorited) {
      setIsFavorited(false);
      setFavoritesCount(prev => Math.max(0, prev - 1));
      unfavoriteNewsMutation.mutate({ newsId, brandId, productId });
    } else {
      setIsFavorited(true);
      setFavoritesCount(prev => prev + 1);
      favoriteNewsMutation.mutate({ newsId, brandId, productId });
    }
  };

  const handleShare = () => {
    if (isShared) return;
    setIsShared(true);
    setSharesCount(prev => prev + 1);
    shareNewsMutation.mutate({ 
      newsId, 
      request: { shareType: 'INTERNAL_REPOST' },
      brandId,
      productId,
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="News Detail"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          flex={1}
          contentContainerStyle={{ paddingBottom: bottomInset }}
        >
          {isLoading ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                Loading news...
              </Text>
            </VStack>
          ) : error ? (
            <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
              <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                Error loading news
              </Text>
            </VStack>
          ) : newsDetail ? (
            <VStack space="md" p="$4">
              {/* News Banner Image */}
              {(newsDetail.banner || newsDetail.image) && (
                <Box
                  width="100%"
                  height={200}
                  borderRadius={5}
                  bg="rgba(0, 0, 0, 0.2)"
                  overflow="hidden"
                  mb="$4"
                >
                  <Image
                    source={toImageSource(newsDetail.banner || newsDetail.image)}
                    alt={newsDetail.title}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                </Box>
              )}

              {/* News Content */}
              <VStack space="md">
                {/* Source and Date */}
                <HStack alignItems="center" space="xs">
                  <BookOpenIcon width={12} height={12} color="#B9B9B9" />
                  <Text
                    color="#B9B9B9"
                    fontSize="$2xs"
                    fontWeight="$medium"
                  >
                    {newsDetail.source} - {new Date(newsDetail.date).toLocaleDateString('en-US')}
                  </Text>
                </HStack>

                {/* Title */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$lg"
                  fontWeight="$bold"
                  lineHeight="$xl"
                >
                  {newsDetail.title}
                </Text>

                {/* Author (if available) */}
                {newsDetail.author && (
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$sm"
                    fontWeight="$medium"
                  >
                    Author: {newsDetail.author}
                  </Text>
                )}

                {/* Tags (if available) */}
                {newsDetail.tags && newsDetail.tags.length > 0 && (
                  <HStack flexWrap="wrap" space="xs">
                    {newsDetail.tags.map((tag, index) => (
                      <Box
                        key={index}
                        bg={isDark ? '#1A1A1A' : '#F0F0F0'}
                        px="$2"
                        py="$1"
                        borderRadius={5}
                      >
                        <Text fontSize="$2xs" color={isDark ? '#FFFFFF' : '#000000'}>
                          #{tag}
                        </Text>
                      </Box>
                    ))}
                  </HStack>
                )}

                {/* Content */}
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize="$2xs"
                  lineHeight="$sm"
                  textAlign="justify"
                >
                  {newsDetail.content}
                </Text>

                {/* Interactions */}
                <HStack space="md" mt="$4" pt="$4" borderTopWidth={1} borderTopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}>
                  {/* Like Button */}
                  <Pressable onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {isLiked ? (
                      <HeartSolidIcon size={20} color="#FF3B30" />
                    ) : (
                      <HeartIcon size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    )}
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$xs">
                      {likesCount.toLocaleString()}
                    </Text>
                  </Pressable>

                  {/* Comment Button */}
                  <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <BookOpenIcon size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$xs">
                      {commentsCount.toLocaleString()}
                    </Text>
                  </Pressable>

                  {/* Share Button */}
                  <Pressable onPress={handleShare} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ShareIcon size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$xs">
                      {sharesCount.toLocaleString()}
                    </Text>
                  </Pressable>

                  {/* Favorite Button */}
                  <Pressable onPress={handleFavorite} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {isFavorited ? (
                      <BookmarkSolidIcon size={20} color="#FFD700" />
                    ) : (
                      <BookmarkIcon size={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    )}
                    <Text color={isDark ? '#FFFFFF' : '#000000'} fontSize="$xs">
                      {favoritesCount.toLocaleString()}
                    </Text>
                  </Pressable>

                  {/* Views Count */}
                  <HStack alignItems="center" gap={4} ml="auto">
                    <Text color={isDark ? '#B9B9B9' : '#666666'} fontSize="$2xs">
                      {viewsCount.toLocaleString()} views
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </VStack>
          ) : null}
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default NewsDetailScreen;
