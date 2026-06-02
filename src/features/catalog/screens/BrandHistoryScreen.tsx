import React, { useMemo, useState, useRef, useCallback } from 'react';
import { ActivityIndicator, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import {
  ScrollView,
  VStack,
  HStack,
  Text,
  Image,
  Box,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BrandStackParamList } from '../BrandNavigator';
import { Header } from '@/src/components/Header';
import PostCard from '@/src/components/PostCards/PostCard';
import SurveyCard from '../components/SurveyCard';
import { toImageSource } from '@/src/utils';
import { useBrandHistory, useBrandFeed, useBrandSurveys } from '../api/hooks';
import type { BrandFeedPost } from '../types';
import type { PostCardData } from '@/src/types/PostCard';
import { CardType } from '@/src/types/common';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';

type TabKey = 'posts' | 'polls' | 'badges';

const TAB_KEYS: TabKey[] = ['posts', 'polls', 'badges'];

type BrandHistoryScreenNavigationProp = NativeStackNavigationProp<BrandStackParamList, 'BrandHistoryScreen'>;
type BrandHistoryScreenRouteProp = RouteProp<BrandStackParamList, 'BrandHistoryScreen'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BrandHistoryScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('catalog');
  const navigation = useNavigation<BrandHistoryScreenNavigationProp>();
  const route = useRoute<BrandHistoryScreenRouteProp>();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const activeTab = TAB_KEYS[currentPage] ?? 'posts';

  const { brandId } = route.params;

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const { data: brandHistory, isLoading: isHistoryLoading } = useBrandHistory(brandId);
  const { data: feedData, isLoading: isFeedLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandFeed(brandId, 20);
  const { data: surveysData, isLoading: isSurveysLoading, fetchNextPage: fetchSurveysNextPage, hasNextPage: hasSurveysNextPage, isFetchingNextPage: isSurveysFetchingNextPage } = useBrandSurveys(brandId, 20);

  const posts = useMemo(() => {
    if (!feedData?.pages) return [];
    const allPosts: PostCardData[] = [];
    feedData.pages.forEach((page) => {
      const pagePosts = page.items || page.posts || [];
      pagePosts.forEach((item: BrandFeedPost) => {
        if (item.type !== 'post') return;
        const postData = item.data as import('@/src/features/profile/types').ProfilePost;
        if (!postData?.id || !postData?.user?.id) return;

        const avatarSource = toImageSource(postData.user.avatar) || require('@/assets/avatar/default-useravatar.png');
        const contentString = Array.isArray(postData.content)
          ? postData.content.map((c) => c?.content || '').join(' ')
          : (postData.content || '');
        const defaultPostImage = require('@/assets/defaultImages/default-post.png');
        const mappedImages = postData.images
          ?.map((img: string) => toImageSource(img))
          .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
        const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];
        const defaultProductImage = require('@/assets/product/product_01.png');
        let contextImage: any = defaultProductImage;
        if (postData.contextData?.image) {
          const mappedContextImage = toImageSource(postData.contextData.image);
          if (mappedContextImage) contextImage = mappedContextImage;
        }

        allPosts.push({
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
          contextData: postData.contextData
            ? {
                id: postData.contextData.id,
                name: postData.contextData.name || '',
                subName: postData.contextData.subName || '',
                image: contextImage,
                isOwned: postData.contextData.isOwned || false,
              }
            : undefined,
        });
      });
    });
    return allPosts;
  }, [feedData]);

  const surveys = useMemo(() => {
    if (!surveysData?.pages) return [];
    const all: import('../types').Survey[] = [];
    surveysData.pages.forEach((page) => {
      if (page.items) all.push(...page.items);
    });
    return all;
  }, [surveysData]);

  const badges = brandHistory?.badges ?? [];
  const tabBorderColor = isDark ? '#FFFFFF' : '#000000';
  const tabInactiveColor = isDark ? '#9D9D9D' : '#9D9D9D';

  const renderTabBar = () => (
    <HStack borderBottomWidth={1} borderColor={isDark ? '#333333' : '#E9E9E9'} px="$4" mb="$2">
      {TAB_KEYS.map((tab, index) => (
        <Pressable
          key={tab}
          onPress={() => handleTabPress(index)}
          flex={1}
          py="$3"
          alignItems="center"
          borderBottomWidth={2}
          borderBottomColor={currentPage === index ? tabBorderColor : 'transparent'}
        >
          <Text
            fontSize="$sm"
            fontWeight={currentPage === index ? '$bold' : '$normal'}
            color={currentPage === index ? (isDark ? '#FFFFFF' : '#000000') : tabInactiveColor}
          >
            {t(`brandHistory.tabs.${tab}`)}
          </Text>
        </Pressable>
      ))}
    </HStack>
  );

  const renderPosts = () => {
    if (isFeedLoading) {
      return (
        <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
            {t('brandHistory.loadingPosts')}
          </Text>
        </VStack>
      );
    }
    if (posts.length === 0) {
      return (
        <VStack alignItems="center" py="$8">
          <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
            {t('brandHistory.noPosts')}
          </Text>
        </VStack>
      );
    }
    return (
      <VStack space="md" p="$4">
        {posts.map((post) => (
          <PostCard key={post.id} data={post} hideProduct={true} />
        ))}
        {isFetchingNextPage && (
          <VStack alignItems="center" py="$4">
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
          </VStack>
        )}
      </VStack>
    );
  };

  const renderPolls = () => {
    if (isSurveysLoading) {
      return (
        <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
          <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
            {t('brandHistory.loadingSurveys')}
          </Text>
        </VStack>
      );
    }
    if (surveys.length === 0) {
      return (
        <VStack alignItems="center" py="$8">
          <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
            {t('brandHistory.noSurveys')}
          </Text>
        </VStack>
      );
    }
    return (
      <VStack p="$4">
        {surveys.map((survey) => (
          <SurveyCard
            key={survey.id}
            survey={survey}
            onPress={() => navigation.navigate('SurveyScreen', { brandId })}
          />
        ))}
        {isSurveysFetchingNextPage && (
          <VStack alignItems="center" py="$4">
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
          </VStack>
        )}
      </VStack>
    );
  };

  const renderBadges = () => {
    if (isHistoryLoading) {
      return (
        <VStack alignItems="center" py="$8" flex={1} justifyContent="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </VStack>
      );
    }
    if (badges.length === 0) {
      return (
        <VStack alignItems="center" py="$8">
          <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
            {t('brandHistory.noBadges')}
          </Text>
        </VStack>
      );
    }
    return (
      <Box p="$4">
        <VStack space="lg">
          {[0, 1].map((rowIndex) => (
            <HStack key={rowIndex} space="md" justifyContent="flex-start">
              {badges.slice(rowIndex * 2, rowIndex * 2 + 2).map((badge) => (
                <VStack key={badge.id} space="xs" alignItems="center" flex={1}>
                  <Box
                    w={70}
                    h={70}
                    borderRadius={8}
                    overflow="hidden"
                    justifyContent="center"
                    alignItems="center"
                    bg={isDark ? '#1A1A1A' : '#F5F5F5'}
                  >
                    <Image
                      source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                      alt={badge.title}
                      w={60}
                      h={60}
                      resizeMode="contain"
                    />
                  </Box>
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$xs"
                    fontWeight="$bold"
                    textAlign="center"
                    numberOfLines={2}
                  >
                    {badge.title}
                  </Text>
                </VStack>
              ))}
            </HStack>
          ))}
        </VStack>
        <Pressable
          onPress={() => navigationService.navigateNested(TAB_ROUTES.EVENTS, 'RewardsBadges', undefined)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          mt="$6"
        >
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize="$sm"
            textAlign="center"
            fontWeight="$normal"
          >
            {t('brandHistory.seeMoreCollections')}
          </Text>
        </Pressable>
      </Box>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title={t('brandHistory.title')}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />

        {renderTabBar()}

        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          {/* Posts */}
          <View key="0" style={styles.page}>
            <ScrollView
              style={styles.scrollPage}
              contentContainerStyle={styles.scrollContent}
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                if (isCloseToBottom && hasNextPage && !isFetchingNextPage) fetchNextPage();
              }}
              scrollEventThrottle={400}
            >
              {renderPosts()}
            </ScrollView>
          </View>
          {/* Polls */}
          <View key="1" style={styles.page}>
            <ScrollView
              style={styles.scrollPage}
              contentContainerStyle={styles.scrollContent}
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                if (isCloseToBottom && hasSurveysNextPage && !isSurveysFetchingNextPage) fetchSurveysNextPage();
              }}
              scrollEventThrottle={400}
            >
              {renderPolls()}
            </ScrollView>
          </View>
          {/* Badges */}
          <View key="2" style={styles.page}>
            <ScrollView
              style={styles.scrollPage}
              contentContainerStyle={styles.scrollContent}
            >
              {renderBadges()}
            </ScrollView>
          </View>
        </PagerView>
      </VStack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  page: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  scrollPage: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default BrandHistoryScreen;
