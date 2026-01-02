import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, VStack, ActivityIndicator, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import BrandProductInfoCard from '../components/BrandProductInfoCard';
import FilterTabs from '../components/FilterTabs';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import NewsCard from '../components/NewsCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useProductDetail, useProductPosts, useProductNews } from '../api/hooks';
import type { BrandFeedPost } from '../types';
import type { PostCardData } from '@/src/types/PostCard';
import { CardType } from '@/src/types/common';

type BrandProductDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandProductDetailScreen'>;
type BrandProductDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandProductDetailScreen'>;

const BrandProductDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandProductDetailScreenNavigationProp>();
    const route = useRoute<BrandProductDetailScreenRouteProp>();
    const [selectedTab, setSelectedTab] = useState('Deneyim Paylaşımı');
    const bottomInset = useSafeAreaValues('bottom');

    const { productId } = route.params;

    const filterTabs = ['Deneyim Paylaşımı', 'Yorumlar', 'Karşılaştırmalar', 'Haberler'];

    // API hooks
    const { data: productDetail, isLoading: isLoadingProduct } = useProductDetail(productId);
    const { data: experiencePosts, isLoading: isLoadingExperience, fetchNextPage: fetchNextExperience, hasNextPage: hasNextExperience, isFetchingNextPage: isFetchingNextExperience } = useProductPosts(productId, 'experience', 20);
    const { data: commentPosts, isLoading: isLoadingComments, fetchNextPage: fetchNextComments, hasNextPage: hasNextComments, isFetchingNextPage: isFetchingNextComments } = useProductPosts(productId, 'comments', 20);
    const { data: benchmarkPosts, isLoading: isLoadingBenchmark, fetchNextPage: fetchNextBenchmark, hasNextPage: hasNextBenchmark, isFetchingNextPage: isFetchingNextBenchmark } = useProductPosts(productId, 'benchmark', 20);
    const { data: newsData, isLoading: isLoadingNews, fetchNextPage: fetchNextNews, hasNextPage: hasNextNews, isFetchingNextPage: isFetchingNextNews } = useProductNews(productId, 20);

    // Transform API posts data
    const transformPosts = useMemo(() => {
        const transform = (postsData: typeof experiencePosts) => {
            if (!postsData?.pages) return [];
            const allPosts: PostCardData[] = [];
            postsData.pages.forEach((page) => {
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
        };
        return {
            experience: transform(experiencePosts),
            comments: transform(commentPosts),
            benchmark: transform(benchmarkPosts),
        };
    }, [experiencePosts, commentPosts, benchmarkPosts]);

    // Transform API news data
    const newsItems = useMemo(() => {
        if (!newsData?.pages) return [];
        const allNews: Array<{
            id: string;
            title: string;
            description: string;
            source: string;
            date: string;
            image: any;
        }> = [];
        newsData.pages.forEach((page) => {
            if (page.items) {
                page.items.forEach((item) => {
                    allNews.push({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        source: item.source,
                        date: item.date,
                        image: toImageSource(item.image),
                    });
                });
            }
        });
        return allNews;
    }, [newsData]);

    const handleTabChange = (tab: string) => {
        setSelectedTab(tab);
    };

    const renderContent = () => {
        if (selectedTab === 'Haberler') {
            if (isLoadingNews) {
                return (
                    <VStack alignItems="center" py="$8">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                            Loading news...
                        </Text>
                    </VStack>
                );
            }
            if (newsItems.length === 0) {
                return (
                    <VStack alignItems="center" py="$8">
                        <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                            No news found
                        </Text>
                    </VStack>
                );
            }
            return (
                <VStack space="md">
                    {newsItems.map((news) => (
                        <NewsCard
                            key={news.id}
                            id={news.id}
                            title={news.title}
                            description={news.description}
                            source={news.source}
                            date={news.date}
                            image={news.image}
                            onPress={() => navigation.navigate('NewsDetailScreen', { newsId: news.id })}
                        />
                    ))}
                    {hasNextNews && (
                        <VStack alignItems="center" py="$4">
                            {isFetchingNextNews ? (
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            ) : (
                                <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" onPress={() => fetchNextNews()}>
                                    Load More
                                </Text>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }

        if (selectedTab === 'Karşılaştırmalar') {
            if (isLoadingBenchmark) {
                return (
                    <VStack alignItems="center" py="$8">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                            Loading comparisons...
                        </Text>
                    </VStack>
                );
            }
            if (transformPosts.benchmark.length === 0) {
                return (
                    <VStack alignItems="center" py="$8">
                        <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                            No comparisons found
                        </Text>
                    </VStack>
                );
            }
            return (
                <VStack space="md">
                    {transformPosts.benchmark.map((post) => (
                        <BenchmarkPostCard
                            key={post.id}
                            data={post as any}
                        />
                    ))}
                    {hasNextBenchmark && (
                        <VStack alignItems="center" py="$4">
                            {isFetchingNextBenchmark ? (
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            ) : (
                                <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" onPress={() => fetchNextBenchmark()}>
                                    Load More
                                </Text>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }

        if (selectedTab === 'Yorumlar') {
            if (isLoadingComments) {
                return (
                    <VStack alignItems="center" py="$8">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                            Loading comments...
                        </Text>
                    </VStack>
                );
            }
            if (transformPosts.comments.length === 0) {
                return (
                    <VStack alignItems="center" py="$8">
                        <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                            No comments found
                        </Text>
                    </VStack>
                );
            }
            return (
                <VStack space="md">
                    {transformPosts.comments.map((post) => (
                        <ExperiencePostCard
                            key={post.id}
                            data={post as any}
                        />
                    ))}
                    {hasNextComments && (
                        <VStack alignItems="center" py="$4">
                            {isFetchingNextComments ? (
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            ) : (
                                <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" onPress={() => fetchNextComments()}>
                                    Load More
                                </Text>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }

        // Default: Deneyim Paylaşımı posts
        if (isLoadingExperience) {
            return (
                <VStack alignItems="center" py="$8">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text mt="$4" fontSize={14} color="$textLight500" $dark-color="$textDark400">
                        Loading experiences...
                    </Text>
                </VStack>
            );
        }
        if (transformPosts.experience.length === 0) {
            return (
                <VStack alignItems="center" py="$8">
                    <Text fontSize={14} color="$textLight500" $dark-color="$textDark400">
                        No experiences found
                    </Text>
                </VStack>
            );
        }
        return (
            <VStack space="md">
                {transformPosts.experience.map((post) => (
                    <ExperiencePostCard
                        key={post.id}
                        data={post as any}
                    />
                ))}
                {hasNextExperience && (
                    <VStack alignItems="center" py="$4">
                        {isFetchingNextExperience ? (
                            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                        ) : (
                            <Text fontSize={14} color="$textLight500" $dark-color="$textDark400" onPress={() => fetchNextExperience()}>
                                Load More
                            </Text>
                        )}
                    </VStack>
                )}
            </VStack>
        );
    };

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                {/* Header */}
                <Header
                    title="Marka Ürünleri Defteri"
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                />

                <ScrollView
                    flex={1}
                    contentContainerStyle={{ paddingBottom: bottomInset }}
                >
                    <VStack space="md" p="$4">
                        {/* Product Info Card */}
                        {isLoadingProduct ? (
                            <VStack alignItems="center" py="$4">
                                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                            </VStack>
                        ) : productDetail ? (
                            <BrandProductInfoCard
                                productName={productDetail.name}
                                productImage={productDetail.image ? toImageSource(productDetail.image) : require('@/assets/events/card-icon.png')}
                            />
                        ) : null}

                        {/* Filter Tabs */}
                        <FilterTabs
                            tabs={filterTabs}
                            onTabChange={handleTabChange}
                        />

                        {/* Dynamic Content */}
                        {renderContent()}
                    </VStack>
                </ScrollView>
            </VStack>
        </SafeAreaView>
    );
};

export default BrandProductDetailScreen;
