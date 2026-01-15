import React, { useState, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';
import { ScrollView, VStack, Text, Button, ButtonText, Pressable } from '@gluestack-ui/themed';
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
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { BenchmarkCardData } from '@/src/types/BenchmarkCard';

type BrandProductDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandProductDetailScreen'>;
type BrandProductDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandProductDetailScreen'>;

const BrandProductDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandProductDetailScreenNavigationProp>();
    const route = useRoute<BrandProductDetailScreenRouteProp>();
    const [selectedTab, setSelectedTab] = useState('Experiences');
    const bottomInset = useSafeAreaValues('bottom');

    const { productId } = route.params;

    const filterTabs = ['Experiences', 'Comments', 'Comparisons', 'News'];

    // API hooks
    const { data: productDetail, isLoading: isLoadingProduct } = useProductDetail(productId);
    const { data: experiencePosts, isLoading: isLoadingExperience, fetchNextPage: fetchNextExperience, hasNextPage: hasNextExperience, isFetchingNextPage: isFetchingNextExperience } = useProductPosts(productId, 'experience', 20);
    const { data: commentPosts, isLoading: isLoadingComments, fetchNextPage: fetchNextComments, hasNextPage: hasNextComments, isFetchingNextPage: isFetchingNextComments } = useProductPosts(productId, 'comments', 20);
    const { data: benchmarkPosts, isLoading: isLoadingBenchmark, fetchNextPage: fetchNextBenchmark, hasNextPage: hasNextBenchmark, isFetchingNextPage: isFetchingNextBenchmark } = useProductPosts(productId, 'benchmark', 20);
    const { data: newsData, isLoading: isLoadingNews, fetchNextPage: fetchNextNews, hasNextPage: hasNextNews, isFetchingNextPage: isFetchingNextNews } = useProductNews(productId, 20);

    // Map Experience (ReviewApiItem) to ReviewCardData
    const mapExperienceToCardData = useCallback((item: BrandFeedPost): ReviewCardData => {
        // Type guard: experience type kontrolü
        if (item.type !== 'experience') {
            throw new Error(`Expected experience type, got ${item.type}`);
        }
        
        const postData = item.data as import('@/src/types/ReviewsCard').ReviewApiItem;
        const avatarSource = toImageSource(postData.user.avatar)!;
        const productImage = postData.contextData?.image
            ? toImageSource(postData.contextData.image)
            : undefined;

        // Content array'i map et - rating 0-100 arası, 0-5 arasına çevir (her 20 = 1 star)
        const content: ReviewCardContentItem[] = Array.isArray(postData.content) 
            ? postData.content.map((contentItem) => {
                // Rating 0-100 arası, 0-5 arasına çevir
                const ratingValue = contentItem.rating || 0;
                const stars = Math.floor(ratingValue / 20); // 0-100 -> 0-5
                
                return {
                    tag: {
                        icon: 'tag' as const,
                        title: contentItem.title || '',
                    },
                    text: contentItem.content || '',
                    rating: Array(5)
                        .fill(false)
                        .map((_, index) => index < stars),
                };
            })
            : [];

        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource,
                action: 'wrote a review',
            },
            contextData: {
                id: postData.contextData?.id || '',
                name: postData.contextData?.name || '',
                subName: postData.contextData?.subName || '',
                image: productImage,
                isOwned: postData.contextData?.isOwned,
            },
            content,
            tags: postData.tags || [],
            images: postData.images
                ?.map((img: string) => toImageSource(img))
                .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
            stats: postData.stats,
            createdAt: postData.createdAt,
        };
    }, []);

    // Map Benchmark to BenchmarkCardData
    const mapBenchmarkToCardData = useCallback((item: BrandFeedPost): BenchmarkCardData => {
        // Type guard: benchmark type kontrolü
        if (item.type !== 'benchmark') {
            throw new Error(`Expected benchmark type, got ${item.type}`);
        }
        
        const postData = item.data as import('@/src/types/BenchmarkCard').BenchmarkApiItem;
        const avatarSource = toImageSource(postData.user.avatar)!;

        const products: import('@/src/types/BenchmarkCard').BenchmarkProduct[] = (postData.products || []).map((p) => ({
            id: p.id,
            name: p.name,
            subName: p.subName,
            image: toImageSource(p.image)!,
            isOwned: p.isOwned,
            choice: p.choice,
        }));

        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource,
            },
            products,
            content: postData.content || '',
            stats: postData.stats,
            createdAt: postData.createdAt,
        };
    }, []);

    // Transform API posts data
    const transformPosts = useMemo(() => {
        const transformExperience = (postsData: typeof experiencePosts): ReviewCardData[] => {
            if (!postsData?.pages) return [];
            const allPosts: ReviewCardData[] = [];
            postsData.pages.forEach((page) => {
                if (page.items) {
                    page.items.forEach((item: BrandFeedPost) => {
                        if (item.type === 'experience') {
                            try {
                                allPosts.push(mapExperienceToCardData(item));
                            } catch (error) {
                                console.error('[transformPosts] Error mapping experience post:', error);
                            }
                        }
                    });
                }
            });
            return allPosts;
        };

        const transformBenchmark = (postsData: typeof benchmarkPosts): BenchmarkCardData[] => {
            if (!postsData?.pages) return [];
            const allPosts: BenchmarkCardData[] = [];
            postsData.pages.forEach((page) => {
                if (page.items) {
                    page.items.forEach((item: BrandFeedPost) => {
                        if (item.type === 'benchmark') {
                            try {
                                allPosts.push(mapBenchmarkToCardData(item));
                            } catch (error) {
                                console.error('[transformPosts] Error mapping benchmark post:', error);
                            }
                        }
                    });
                }
            });
            return allPosts;
        };

        const transformComments = (postsData: typeof commentPosts): ReviewCardData[] => {
            if (!postsData?.pages) return [];
            const allPosts: ReviewCardData[] = [];
            postsData.pages.forEach((page) => {
                if (page.items) {
                    page.items.forEach((item: BrandFeedPost) => {
                        if (item.type === 'experience') {
                            try {
                                allPosts.push(mapExperienceToCardData(item));
                            } catch (error) {
                                console.error('[transformPosts] Error mapping comment post:', error);
                            }
                        }
                    });
                }
            });
            return allPosts;
        };

        return {
            experience: transformExperience(experiencePosts),
            comments: transformComments(commentPosts),
            benchmark: transformBenchmark(benchmarkPosts),
        };
    }, [experiencePosts, commentPosts, benchmarkPosts, mapExperienceToCardData, mapBenchmarkToCardData]);

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
        if (selectedTab === 'News') {
            if (isLoadingNews) {
                return (
                    <VStack alignItems="center" py="$8">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                            Loading news...
                        </Text>
                    </VStack>
                );
            }
            if (newsItems.length === 0) {
                return (
                    <VStack alignItems="center" py="$8">
                        <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onPress={() => fetchNextNews()}
                                    bg="transparent"
                                    borderColor={isDark ? '$borderDark400' : '$borderLight300'}
                                >
                                    <ButtonText fontSize="$sm" color={isDark ? '$textDark400' : '$textLight500'}>
                                        Load More
                                    </ButtonText>
                                </Button>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }

        if (selectedTab === 'Comparisons') {
            if (isLoadingBenchmark) {
                return (
                    <VStack alignItems="center" py="$8">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                            Loading comparisons...
                        </Text>
                    </VStack>
                );
            }
            if (transformPosts.benchmark.length === 0) {
                return (
                    <VStack alignItems="center" py="$8">
                        <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
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
                            data={post}
                        />
                    ))}
                    {hasNextBenchmark && (
                        <VStack alignItems="center" py="$4">
                            {isFetchingNextBenchmark ? (
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onPress={() => fetchNextBenchmark()}
                                    bg="transparent"
                                    borderColor={isDark ? '$borderDark400' : '$borderLight300'}
                                >
                                    <ButtonText fontSize="$sm" color={isDark ? '$textDark400' : '$textLight500'}>
                                        Load More
                                    </ButtonText>
                                </Button>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }

        if (selectedTab === 'Comments') {
            if (isLoadingComments) {
                return (
                    <VStack alignItems="center" py="$8">
                        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                        <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                            Loading comments...
                        </Text>
                    </VStack>
                );
            }
            if (transformPosts.comments.length === 0) {
                return (
                    <VStack alignItems="center" py="$8">
                        <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
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
                            data={post}
                        />
                    ))}
                    {hasNextComments && (
                        <VStack alignItems="center" py="$4">
                            {isFetchingNextComments ? (
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onPress={() => fetchNextComments()}
                                    bg="transparent"
                                    borderColor={isDark ? '$borderDark400' : '$borderLight300'}
                                >
                                    <ButtonText fontSize="$sm" color={isDark ? '$textDark400' : '$textLight500'}>
                                        Load More
                                    </ButtonText>
                                </Button>
                            )}
                        </VStack>
                    )}
                </VStack>
            );
        }

        // Default: Experiences posts
        if (isLoadingExperience) {
            return (
                <VStack alignItems="center" py="$8">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text mt="$4" fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
                        Loading experiences...
                    </Text>
                </VStack>
            );
        }
        if (transformPosts.experience.length === 0) {
            return (
                <VStack alignItems="center" py="$8">
                    <Text fontSize="$sm" color="$textLight500" $dark-color="$textDark400">
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
                        data={post}
                    />
                ))}
                {hasNextExperience && (
                    <VStack alignItems="center" py="$4">
                        {isFetchingNextExperience ? (
                            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => fetchNextExperience()}
                                bg="transparent"
                                borderColor={isDark ? '$borderDark400' : '$borderLight300'}
                            >
                                <ButtonText fontSize="$sm" color={isDark ? '$textDark400' : '$textLight500'}>
                                    Load More
                                </ButtonText>
                            </Button>
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
                    title="Product Details"
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
