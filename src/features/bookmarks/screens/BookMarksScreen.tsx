import React from 'react';
import { VStack, ScrollView, Text, Box } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorMode } from '@/src/hooks/useColorMode';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import { Header } from '@/src/components/Header';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserBookmarks, useUserBookmarksWithFallback } from '../api/hooks';
import { CardType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';
import type { BookmarkApiItem } from '../api/bookmarksApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';

const BookMarksScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  // Eski endpoint'i dene, hata durumunda yeni endpoint'e geç
  const { data: bookmarksData, isLoading, error } = useUserBookmarksWithFallback();
  
  // Extract bookmarks array from response
  const bookmarks = bookmarksData || [];

  // Map Post bookmark to PostCardData
  const mapPostToCardData = (item: ProfilePost & { type: 'post' }): PostCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    // content array ise string'e çevir, değilse direkt kullan
    const contentString = Array.isArray(item.content)
      ? item.content.map((contentItem) => contentItem.content || '').join(' ')
      : (item.content || '');

    // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
    const mappedImages = item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) ?? [];
    const images = mappedImages;

    // contextData.image için fallback
    const contextImage = item.contextData?.image
      ? toImageSource(item.contextData.image)
      : undefined;
    const contextData = item.contextData
      ? {
          ...item.contextData,
          image: contextImage || item.contextData.image || defaultPostImage,
        }
      : undefined;

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: toImageSource(item.user.avatar)!,
      },
      content: contentString,
      images,
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: item.contextType,
      contextData,
    };
  };

  // Map Benchmark bookmark to BenchmarkCardData
  const mapBenchmarkToCardData = (item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
    const avatarSource = toImageSource(item.user.avatar)!;

    const products: BenchmarkProduct[] = item.products.map((p) => ({
      id: p.id,
      name: p.name,
      subName: p.subName,
      image: toImageSource(p.image)!,
      isOwned: p.isOwned,
      choice: p.choice,
    }));

    return {
      id: item.id,
      user: {
        id: item.user.id,
        name: item.user.name,
        title: item.user.title,
        avatar: avatarSource,
      },
      products,
      content: item.content,
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  // Map Tips bookmark to TipsCardData
  const mapTipsToCardData = (item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
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
      images: item.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
      stats: item.stats,
      tag: item.tag,
    benefitCategory: item.benefitCategory,
      createdAt: item.createdAt,
    };
  };

  // Map Question bookmark to QuestionCardData
  const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
    const avatarSource = toImageSource(item.user.avatar)!;

    const product: QuestionCardProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: toImageSource(item.contextData.image)!,
    };

    const category: QuestionCardCategory = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: toImageSource(item.contextData.image)!,
      product,
    };

    // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
    const mappedImages = item.images
      ?.map((img) => toImageSource(img))
      .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
    const images = mappedImages;

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
      isBoosted: item.isBoosted,
      images,
      stats: item.stats,
      createdAt: item.createdAt,
    };
  };

  const renderBookmark = (bookmark: BookmarkApiItem) => {
    // Type guard'lar ile type narrowing yapıyoruz
    if (bookmark.type === 'benchmark') {
      return (
        <BenchmarkPostCard
          key={bookmark.id}
          data={mapBenchmarkToCardData(bookmark)}
        />
      );
    }
    
    if (bookmark.type === 'tipsAndTricks') {
      return (
        <TipsAndTricksPostCard
          key={bookmark.id}
          data={mapTipsToCardData(bookmark)}
        />
      );
    }
    
    if (bookmark.type === 'question') {
      return (
        <QuestionPostCard
          key={bookmark.id}
          data={mapQuestionToCardData(bookmark)}
        />
      );
    }
    
    // Default: Post
    if (bookmark.type === 'post') {
      return (
        <PostCard
          key={bookmark.id}
          data={mapPostToCardData(bookmark)}
        />
      );
    }
    
    // Fallback - eğer beklenmeyen bir tip gelirse
    return null;
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={true} />
      
      {/* Top inset view - Status bar için beyaz arka plan */}
      <Box 
        height={insets.top} 
        bg="#FFFFFF"
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={1}
      />
      
      <VStack flex={1} pt={insets.top}>
        {/* Header */}
        <Header
          title="Bookmarks"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* Content */}
        <ScrollView 
          flex={1} 
          px={15} 
          py={0}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          {isLoading && !bookmarksData && (
            <Box py={20} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                Bookmarks yükleniyor...
              </Text>
            </Box>
          )}

          {error && (
            <Box py={20} alignItems="center">
              <Text color="#CE4A4A" fontSize="$sm">
                An error occurred while loading bookmarks: {error.message}
              </Text>
            </Box>
          )}

          {!isLoading && !error && (!bookmarks || bookmarks.length === 0) && (
            <Box py={20} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                No bookmarks yet.
              </Text>
            </Box>
          )}

          {!isLoading && !error && bookmarks && bookmarks.length > 0 && (
            <VStack space="md" pb={20}>
              {bookmarks.map((bookmark) => renderBookmark(bookmark))}
            </VStack>
          )}
        </ScrollView>
      </VStack>
      
      {/* Bottom inset view - Device router için beyaz arka plan */}
      <Box 
        height={insets.bottom} 
        bg="#FFFFFF"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        zIndex={1}
      />
    </Box>
  );
};

export default BookMarksScreen;
