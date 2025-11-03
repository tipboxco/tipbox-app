import React from 'react';
import { VStack, ScrollView, SafeAreaView } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { Header } from '@/src/components/Header';
import { Post } from '@/src/mock/profile/posts/types';
import { BenchmarkPost } from '@/src/mock/profile/benchmark/types';
import { TipsAndTricksPost } from '@/src/mock/profile/tipsAndTricks/types';
import { Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BookMarksScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const navigation = useNavigation();

  // Mock data for bookmarked posts
  const bookmarkedPosts: (Post | BenchmarkPost | TipsAndTricksPost)[] = [
    {
      id: '1',
      user: {
        id: '1',
        name: 'Rachel Jamille',
        title: 'Beauty Tech Enthusiast · Product Reviewer · Digital Shop...',
        avatar: require('@/assets/avatar/ozan.png'),
      },
      category: {
        id: '1',
        name: 'Tips & Tricks',
        subCategory: 'Kalıcılık / Dayanıklılık',
        image: require('@/assets/common/inventory.png'),
      },
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud t dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...',
      stats: {
        likes: 110,
        comments: 32,
        shares: 11,
        bookmarks: 32,
      },
      tag: 'Tips & Tricks',
      createdAt: '2024-01-15',
    } as Post,
    {
      id: '2',
      user: {
        id: '2',
        name: 'Rachel Jamille',
        title: 'Beauty Tech Enthusiast · Product Reviewer · Digital Shop...',
        avatar: require('@/assets/avatar/ozan.png'),
      },
      products: [
        {
          id: '1',
          name: 'Dyson V15s Detect Submarine™ Wet & Dry Cordl...',
          subName: 'Premium Vacuum',
          image: require('@/assets/inventory/product_01.png'),
          isOwned: true,
          choice: true,
        },
        {
          id: '2',
          name: 'PHILIPS Azur DST8050/20 Buharlı Ütü',
          subName: 'Steam Iron',
          image: require('@/assets/inventory/product_02.png'),
          isOwned: false,
          choice: false,
        },
      ],
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud t dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...',
      stats: {
        likes: 110,
        comments: 32,
        shares: 11,
        bookmarks: 32,
      },
      createdAt: '2024-01-14',
    } as BenchmarkPost,
    {
      id: '3',
      user: {
        id: '3',
        name: 'Rachel Jamille',
        title: 'Beauty Tech Enthusiast · Product Reviewer · Digital Shop...',
        avatar: require('@/assets/avatar/ozan.png'),
      },
      category: {
        id: '3',
        name: 'Tips & Tricks',
        subCategory: 'Kalıcılık / Dayanıklılık',
        image: require('@/assets/common/inventory.png'),
        product: {
          id: '3',
          name: 'PHILIPS Azur DST8050/20 Buharlı Ütü',
          subName: 'Steam Iron',
          image: require('@/assets/inventory/product_03.png'),
        },
      },
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud t dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...',
      images: [
        require('@/assets/inventory/product_01.png'),
        require('@/assets/inventory/product_02.png'),
      ],
      stats: {
        likes: 110,
        comments: 32,
        shares: 11,
        bookmarks: 32,
      },
      tag: 'Tips & Tricks',
      createdAt: '2024-01-13',
    } as TipsAndTricksPost,
  ];

  const renderPost = (post: Post | BenchmarkPost | TipsAndTricksPost, index: number) => {
    if ('products' in post) {
      return <BenchmarkPostCard key={(post as BenchmarkPost).id} data={post as BenchmarkPost} />;
    } else if ('tag' in post && 'category' in post) {
      return <TipsAndTricksPostCard key={(post as TipsAndTricksPost).id} data={post as TipsAndTricksPost} />;
    } else {
      return <PostCard key={(post as Post).id} data={post as Post} />;
    }
  };

  return (
    <SafeAreaView flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
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
        >
          <VStack space="md" pb={20}>
            {bookmarkedPosts.map((post, index) => renderPost(post, index))}
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default BookMarksScreen;
