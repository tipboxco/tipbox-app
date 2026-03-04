import React, { useEffect, useMemo, useCallback } from 'react';
import { Dimensions, ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
    Button,
    ButtonText,
} from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BrandStackParamList } from '../BrandNavigator';
import { Header } from '@/src/components/Header';
import {
  ArrowTopRightOnSquareIcon,
  UsersIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from 'react-native-heroicons/outline';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import { useSafeAreaValues, toImageSource, isSameImageSource } from '@/src/utils';
import { useBrandCatalog, useBrandFeed, useJoinBrand, useLeaveBrand } from '../api/hooks';
import type { BrandFeedPost } from '../types';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import { CardType, ProductInfoType } from '@/src/types/common';
import { useTranslation } from '@/src/hooks/useTranslation';

const { width } = Dimensions.get('window');

// Banner ve header yükseklikleri
const BANNER_HEIGHT = 250;
const HEADER_HEIGHT = 80; // Sticky header yüksekliği

type BrandDetailScreenNavigationProp = NativeStackNavigationProp<BrandStackParamList, 'BrandDetailScreen'>;
type BrandDetailScreenRouteProp = RouteProp<BrandStackParamList, 'BrandDetailScreen'>;

const BrandDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandDetailScreenNavigationProp>();
    const route = useRoute<BrandDetailScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const bottomInset = insets.bottom;
    const { t } = useTranslation('catalog');

    // Route params'dan brandId'yi güvenli şekilde al
    const brandId = route.params?.brandId;
    
    // Scroll animation için shared value
    const scrollY = useSharedValue(0);
    
    // Debug: brandId kontrolü
    useEffect(() => {
        console.log('[BrandDetailScreen] Route params:', route.params);
        console.log('[BrandDetailScreen] brandId:', brandId);
    }, [route.params, brandId]);

    // Brand Catalog API hook
    const {
        data: brandCatalog,
        isLoading: isBrandCatalogLoading,
        error: brandCatalogError,
    } = useBrandCatalog(brandId);

    // Brand Feed API hook - infinite scroll ile posts getirilecek (3'erli)
    // Limit parametresi query key'e dahil edildi, böylece limit değiştiğinde yeni query oluşturulur
    const {
        data: brandFeedData,
        fetchNextPage: fetchNextBrandFeedPage,
        hasNextPage: hasNextBrandFeedPage,
        isFetchingNextPage: isFetchingNextBrandFeedPage,
        isLoading: isBrandFeedLoading,
        error: brandFeedError,
    } = useBrandFeed(brandId, 6);

    // Join / Leave brand - optimistic update ile anında UI güncellenir
    const joinBrandMutation = useJoinBrand();
    const leaveBrandMutation = useLeaveBrand();
    const isJoinLeavePending = joinBrandMutation.isPending || leaveBrandMutation.isPending;

    const handleJoinLeavePress = useCallback(() => {
        if (!brandId || isJoinLeavePending) return;
        if (brandCatalog?.isJoined) {
            leaveBrandMutation.mutate(brandId);
        } else {
            joinBrandMutation.mutate(brandId);
        }
    }, [brandId, brandCatalog?.isJoined, isJoinLeavePending, joinBrandMutation, leaveBrandMutation]);

    // Map BrandFeedPost to PostCardData (Post type için)
    const mapBrandPostToPostCardData = useCallback((post: BrandFeedPost): PostCardData => {
        // Type guard: post type kontrolü
        if (post.type !== 'post') {
            throw new Error(`Expected post type, got ${post.type}`);
        }
        
        const postData = post.data as import('@/src/features/profile/types').ProfilePost;
        const avatarSource = toImageSource(postData.user.avatar);
        
        // ContextType PRODUCT ise, contextData.id'nin productId olduğundan emin ol
        // API'den gelen contextData içinde productId alanı varsa onu kullan, yoksa id'yi kullan
        const contextType = postData.contextType as ProductInfoType;
        let contextDataId = postData.contextData?.id;
        
        // Eğer contextType PRODUCT ise ve contextData içinde productId alanı varsa, onu kullan
        if (contextType === ProductInfoType.PRODUCT && postData.contextData) {
            // API response'unda productId alanı olabilir (type assertion ile kontrol et)
            const contextDataAny = postData.contextData as any;
            if (contextDataAny.productId) {
                contextDataId = contextDataAny.productId;
            }
        }
        
        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource || require('@/assets/avatar/default-useravatar.png'),
            },
            content: typeof postData.content === 'string' ? postData.content : '',
            images: postData.images
                ?.map((img: string) => toImageSource(img))
                .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) || [],
            stats: {
                likes: postData.stats.likes,
                comments: postData.stats.comments,
                shares: postData.stats.shares,
                bookmarks: postData.stats.bookmarks,
            },
            createdAt: postData.createdAt,
            contextType,
            contextData: postData.contextData ? {
                id: contextDataId || postData.contextData.id,
                name: postData.contextData.name,
                subName: postData.contextData.subName,
                image: postData.contextData.image,
                isOwned: postData.contextData.isOwned || false,
            } : undefined,
        };
    }, []);

    // Map Experience (ExperiencePostApiItem) to ExperiencePostCardData
    const mapExperienceToCardData = useCallback((item: BrandFeedPost): ExperiencePostCardData => {
        // Type guard: experience type kontrolü
        if (item.type !== 'experience') {
            throw new Error(`Expected experience type, got ${item.type}`);
        }
        
        const postData = item.data as import('@/src/types/ExperienceCard').ExperiencePostApiItem;
        const avatarSource = toImageSource(postData.user.avatar)!;
        const rawProduct = postData.contextData;
        const productImage = rawProduct?.image ? toImageSource(rawProduct.image) : undefined;

        const contentBlocks = postData.experienceContent ?? (Array.isArray(postData.content) ? postData.content : []);
        const content: ExperiencePostCardContentItem[] = Array.isArray(contentBlocks)
            ? contentBlocks.map((contentItem) => {
                const ratingVal = contentItem?.rating ?? 0;
                const stars = ratingVal <= 5 ? Math.min(5, Math.max(0, Math.round(ratingVal))) : Math.floor(ratingVal / 20);
                return {
                    tag: {
                        icon: (contentItem?.title?.toLowerCase?.().includes('product') || contentItem?.title?.toLowerCase?.().includes('usage')) ? 'package' as const : 'tag' as const,
                        title: contentItem?.title || '',
                    },
                    text: contentItem?.content || '',
                    rating: Array(5).fill(false).map((_, index) => index < stars),
                };
            })
            : [];

        let contextDataId = rawProduct?.id || '';
        if (rawProduct && (rawProduct as any).productId) contextDataId = (rawProduct as any).productId;
        const subNameRaw = rawProduct?.subName ?? '';
        const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
        const tags = Array.isArray(postData.tags) ? postData.tags : [];

        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource,
                action: (postData.status === 'own' || rawProduct?.isOwned) ? 'Added new product and experiences to inventory!' : undefined,
            },
            contextData: {
                id: contextDataId,
                name: rawProduct?.name || '',
                subName,
                image: productImage ?? require('@/assets/defaultImages/default-post.png'),
                isOwned: postData.status === 'own' || rawProduct?.isOwned,
            },
            content,
            tags,
            images: (() => {
                const defaultPostImage = require('@/assets/defaultImages/default-post.png');
                const mapped = postData.images
                    ?.map((img: string) => toImageSource(img))
                    .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
                return mapped.filter((img: any) => !isSameImageSource(img, productImage ?? defaultPostImage));
            })(),
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

        const products: BenchmarkProduct[] = (postData.products || []).map((p) => ({
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
            content: typeof postData.content === 'string' ? postData.content : '',
            stats: postData.stats,
            createdAt: postData.createdAt,
        };
    }, []);

    // Map Tips to TipsCardData
    const mapTipsToCardData = useCallback((item: BrandFeedPost): TipsCardData => {
        // Type guard: tipsAndTricks type kontrolü
        if (item.type !== 'tipsAndTricks') {
            throw new Error(`Expected tipsAndTricks type, got ${item.type}`);
        }
        
        const postData = item.data as import('@/src/types/TipsAndTricksCard').TipsApiItem;
        const avatarSource = toImageSource(postData.user.avatar)!;

        const product: TipsProduct = {
            id: postData.contextData.id,
            name: postData.contextData.name,
            subName: postData.contextData.subName,
            image: toImageSource(postData.contextData.image)!,
        };

        const category: TipsCategory = {
            id: postData.contextData.id,
            name: postData.contextData.name,
            subCategory: postData.contextData.subName,
            image: toImageSource(postData.contextData.image)!,
            product,
        };

        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource,
            },
            category,
            content: typeof postData.content === 'string' ? postData.content : '',
            images: postData.images
                ?.map((img: string) => toImageSource(img))
                .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource),
            stats: postData.stats,
            tag: postData.tag,
            createdAt: postData.createdAt,
        };
    }, []);

    // Map Question to QuestionCardData
    const mapQuestionToCardData = useCallback((item: BrandFeedPost): QuestionCardData => {
        // Type guard: question type kontrolü
        if (item.type !== 'question') {
            throw new Error(`Expected question type, got ${item.type}`);
        }
        
        const postData = item.data as import('@/src/types/QuestionCard').QuestionApiItem;
        const avatarSource = toImageSource(postData.user.avatar)!;

        const product: QuestionCardProduct = {
            id: postData.contextData.id,
            name: postData.contextData.name,
            subName: postData.contextData.subName,
            image: toImageSource(postData.contextData.image)!,
        };

        const category: QuestionCardCategory = {
            id: postData.contextData.id,
            name: postData.contextData.name,
            subCategory: postData.contextData.subName,
            image: toImageSource(postData.contextData.image)!,
            product,
        };

        // images array'i boşsa veya görseller yüklenemediyse default görsel ekle
        const defaultPostImage = require('@/assets/defaultImages/default-post.png');
        const mappedImages = postData.images
            ?.map((img: string) => toImageSource(img))
            .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
        const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource,
            },
            category,
            content: typeof postData.content === 'string' ? postData.content : '',
            isBoosted: postData.isBoosted,
            images,
            stats: postData.stats,
            createdAt: postData.createdAt,
        };
    }, []);

    // Transform brand feed posts data for display (flatten all pages and remove duplicates)
    const allPosts = useMemo(() => {
        if (!brandFeedData?.pages) return [];
        
        const allItems = brandFeedData.pages.flatMap((page) => page.items || []);
        
        // Remove duplicates by ID (cursor pagination'da aynı item tekrar gelebilir)
        const uniqueItemsMap = new Map<string, BrandFeedPost>();
        for (const item of allItems) {
            if (!uniqueItemsMap.has(item.data.id)) {
                uniqueItemsMap.set(item.data.id, item);
            }
        }
        
        return Array.from(uniqueItemsMap.values());
    }, [brandFeedData?.pages]);

    // Debug: Log brand feed data
    useEffect(() => {
        console.log('🔍 [BrandDetailScreen] Brand Feed Data:', {
            brandId,
            brandName: brandCatalog?.name,
            pagesCount: brandFeedData?.pages?.length || 0,
            allPostsCount: allPosts.length,
            isLoading: isBrandFeedLoading,
            hasError: !!brandFeedError,
        });

        if (brandFeedData?.pages && brandFeedData.pages.length > 0) {
            console.log('📊 [BrandDetailScreen] First Page Data:', {
                itemsCount: brandFeedData.pages[0]?.items?.length || 0,
                items: brandFeedData.pages[0]?.items,
                pagination: brandFeedData.pages[0]?.pagination,
            });
        }

        if (allPosts.length > 0) {
            console.log('📝 [BrandDetailScreen] All Posts:', {
                count: allPosts.length,
                posts: allPosts.map(post => ({
                    type: post.type,
                    id: post.data.id,
                    userId: post.data.user?.id,
                    userName: post.data.user?.name,
                    content: typeof post.data.content === 'string' 
                        ? post.data.content.substring(0, 50) + '...' 
                        : 'Array content',
                })),
            });
        } else {
            console.log('⚠️ [BrandDetailScreen] No posts found');
        }

        if (brandFeedError) {
            console.error('❌ [BrandDetailScreen] Brand Feed Error:', brandFeedError);
        }
    }, [brandId, brandCatalog?.name, brandFeedData, allPosts, isBrandFeedLoading, brandFeedError]);

    // Render feed item based on type (similar to FeedScreen)
    const renderFeedItem = useCallback((item: BrandFeedPost) => {
        console.log(item.type === CardType.EXPERIENCE ? "Experience Rednder Edildi." : "Düz Card");
        console.log(item.type === CardType.EXPERIENCE ? item.data : "");
        switch (item.type) {
            case CardType.EXPERIENCE:
            case 'experience':
                // Experience type için ExperiencePostApiItem kullan ve ExperiencePostCard render et
                if ('content' in item.data && Array.isArray(item.data.content)) {
                    return (
                        <ExperiencePostCard
                            key={item.data.id}
                            data={mapExperienceToCardData(item)}
                        />
                    );
                }
                return null;
            case CardType.POST:
            case 'post':
                // Post type için PostCard render et
                return (
                    <PostCard
                        key={item.data.id}
                        data={mapBrandPostToPostCardData(item)}
                    />
                );
            case CardType.BENCHMARK:
            case 'benchmark':
                return (
                    <BenchmarkPostCard
                        key={item.data.id}
                        data={mapBenchmarkToCardData(item)}
                    />
                );
            case CardType.QUESTION:
            case 'question':
                // Question type kontrolü
                if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
                    return (
                        <QuestionPostCard
                            key={item.data.id}
                            data={mapQuestionToCardData(item)}
                        />
                    );
                }
                return null;
            case CardType.TIPS_AND_TRICKS:
            case 'tipsAndTricks':
                return (
                    <TipsAndTricksPostCard
                        key={item.data.id}
                        data={mapTipsToCardData(item)}
                    />
                );
            case CardType.UPDATE:
            case 'update':
                // UpdatePostCard için şimdilik null döndür (UpdatePostCard mapping fonksiyonu eklenebilir)
                return null;
            default:
                return null;
        }
    }, [mapBrandPostToPostCardData, mapExperienceToCardData, mapBenchmarkToCardData, mapQuestionToCardData, mapTipsToCardData]);

    // Scroll handler - Reanimated için animasyon + Infinite scroll için sayfa yükleme
    const scrollHandler = useAnimatedScrollHandler(
        {
            onScroll: (event) => {
                scrollY.value = event.contentOffset.y;
                
                // Infinite scroll: ScrollView'in altına yaklaştığında yeni sayfa yükle
                const { layoutMeasurement, contentOffset, contentSize } = event;
                const paddingToBottom = 300;
                const isCloseToBottom =
                    layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

                if (isCloseToBottom && hasNextBrandFeedPage && !isFetchingNextBrandFeedPage) {
                    runOnJS(fetchNextBrandFeedPage)();
                }
            },
        },
        [hasNextBrandFeedPage, isFetchingNextBrandFeedPage, fetchNextBrandFeedPage]
    );

    // Banner parallax animation - scroll'a göre yukarı kayar
    const bannerAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, BANNER_HEIGHT],
            [0, -BANNER_HEIGHT * 0.5], // Parallax effect - banner yarı hızda kayar
            Extrapolate.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [0, BANNER_HEIGHT * 0.5, BANNER_HEIGHT],
            [1, 0.5, 0],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateY }],
            opacity,
        };
    });

    // Sticky header animation - scroll belirli noktaya ulaştığında sabitlenir
    const stickyHeaderAnimatedStyle = useAnimatedStyle(() => {
        // Banner'ın çoğu kaybolduğunda header sticky olur
        const threshold = BANNER_HEIGHT - HEADER_HEIGHT - insets.top;
        
        const translateY = interpolate(
            scrollY.value,
            [threshold - 20, threshold],
            [-HEADER_HEIGHT, 0],
            Extrapolate.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [threshold - 20, threshold],
            [0, 1],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateY }],
            opacity,
        };
    });

    // Loading state
    if (isBrandCatalogLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$4" fontSize="$sm">
                        {t('brandDetail.loading')}
                    </Text>
                </Box>
            </View>
        );
    }

    // Error state
    if (brandCatalogError || !brandCatalog) {
        return (
            <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title={t('brandDetail.brandNotFound')}
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                        <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                            {brandCatalogError ? `${t('brandDetail.error')}: ${brandCatalogError.message}` : t('brandDetail.brandNotFound')}
                        </Text>
                    </Box>
                </Box>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FAFAFA' }}>
            {/* Sticky Header - Scroll'da yukarı sabitlenir */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: insets.top,
                        left: 0,
                        right: 0,
                        height: HEADER_HEIGHT,
                        backgroundColor: isDark ? '#000000' : '#FAFAFA',
                        zIndex: 100,
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? '#1A1A1A' : '#E9E9E9',
                    },
                    stickyHeaderAnimatedStyle,
                ]}
            >
                <HStack
                    px="$4"
                    py="$3"
                    justifyContent="space-between"
                    alignItems="center"
                    height="100%"
                >
                    <VStack flex={1}>
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$lg"
                            fontWeight="$bold"
                            numberOfLines={1}
                        >
                            {brandCatalog?.name}
                        </Text>
                        <HStack alignItems="center" space="sm">
                            <UsersIcon width={12} height={12} color="#9D9D9D" />
                            <Text
                                color="#9D9D9D"
                                fontSize="$xs"
                                fontWeight="$medium"
                            >
                                {t('brandDetail.followers', { count: brandCatalog?.followers })}
                            </Text>
                        </HStack>
                    </VStack>
                    <Button
                        bg={brandCatalog?.isJoined ? "rgba(215, 215, 215, 0.8)" : "#C2E607"}
                        borderRadius={10}
                        minWidth={65}
                        height={24}
                        onPress={handleJoinLeavePress}
                        disabled={isJoinLeavePending}
                        opacity={isJoinLeavePending ? 0.7 : 1}
                    >
                        {isJoinLeavePending ? (
                            <ActivityIndicator size="small" color="#000000" />
                        ) : (
                            <ButtonText
                                color="#000000"
                                fontSize="$xs"
                                fontWeight="$bold"
                                textAlign="center"
                            >
                                {brandCatalog?.isJoined ? t('brandDetail.leave') : t('brandDetail.join')}
                            </ButtonText>
                        )}
                    </Button>
                </HStack>
            </Animated.View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
            >
                {/* Banner Image - Parallax effect */}
                <Animated.View style={bannerAnimatedStyle}>
                    <Box
                        width={width}
                        height={BANNER_HEIGHT}
                        position="relative"
                        overflow="hidden"
                    >
                        <Image
                            source={toImageSource(brandCatalog.bannerImage) || require('@/assets/defaultImages/default-banner.png')}
                            alt="Brand Banner"
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />

                        {/* Gradient Overlay */}
                        <Box
                            position="absolute"
                            top={0}
                            left={0}
                            right={0}
                            bottom={0}
                            bg="rgba(0, 0, 0, 0.6)"
                        />

                        {/* Header Overlay on Banner */}
                        <HStack
                            position="absolute"
                            top={insets.top + 10}
                            left={16}
                            right={16}
                            justifyContent="space-between"
                            alignItems="center"
                            zIndex={10}
                        >
                            <Pressable
                                onPress={() => navigation.goBack()}
                                width={36}
                                height={36}
                                borderRadius={18}
                                bg="rgba(0, 0, 0, 0.6)"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <ChevronLeftIcon width={20} height={20} color="#FFFFFF" />
                            </Pressable>

                            <Pressable
                                width={36}
                                height={36}
                                borderRadius={18}
                                bg="rgba(0, 0, 0, 0.6)"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <ArrowTopRightOnSquareIcon width={20} height={20} color="#FFFFFF" />
                            </Pressable>
                        </HStack>

                        {/* Brand Info Overlay */}
                        <VStack
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            bg="rgba(0, 0, 0, 0.6)"
                            p="$4"
                        >
                            <Text
                                color="#FFFFFF"
                                fontSize="$2xs"
                                lineHeight="$sm"
                                mb="$2"
                            >
                                {t('brandDetail.discoverExperiences', { brandName: brandCatalog.name })}
                            </Text>
                        </VStack>
                    </Box>
                </Animated.View>

                {/* Content */}
                <VStack
                    bg={isDark ? '#000000' : '#FAFAFA'}
                    borderTopLeftRadius={20}
                    borderTopRightRadius={20}
                    mt={-20}
                    flex={1}
                    px={12}
                    py={16}
                >
                    {/* Brand Header */}
                    <HStack justifyContent="space-between" alignItems="center" mb="$2">
                        <VStack flex={1}>
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize="$xl"
                                fontWeight="$bold"
                                mb="$1"
                            >
                                {brandCatalog.name}
                            </Text>
                            <HStack alignItems="center" space="sm">
                                <UsersIcon width={12} height={12} color="#9D9D9D" />
                                <Text
                                    color="#9D9D9D"
                                    fontSize="$xs"
                                    fontWeight="$medium"
                                >
                                    {t('brandDetail.followers', { count: brandCatalog.followers })}
                                </Text>
                            </HStack>
                        </VStack>
                        <Button
                            bg={brandCatalog.isJoined ? "rgba(215, 215, 215, 0.8)" : "#C2E607"}
                            borderRadius={10}
                            minWidth={65}
                            height={24}
                            onPress={handleJoinLeavePress}
                            disabled={isJoinLeavePending}
                            opacity={isJoinLeavePending ? 0.7 : 1}
                        >
                            {isJoinLeavePending ? (
                                <ActivityIndicator size="small" color="#000000" />
                            ) : (
                                <ButtonText
                                    color="#000000"
                                    fontSize="$xs"
                                    fontWeight="$bold"
                                    textAlign="center"
                                >
                                    {brandCatalog.isJoined ? t('brandDetail.leave') : t('brandDetail.join')}
                                </ButtonText>
                            )}
                        </Button>
                    </HStack>

                    {/* Brand Description */}
                    <Text
                        color={isDark ? '#FFFFFF' : '#343434'}
                        fontSize="$2xs"
                        lineHeight="$sm"
                        mb="$4"
                    >
                        {brandCatalog.description}
                    </Text>

                    {/* Browse Section */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#9D9D9D'}
                                fontSize="$sm"
                                fontWeight="$bold"
                            >
                                {t('brandDetail.browse')}
                            </Text>
                        </HStack>

                        {/* Brand Sections - Horizontal Layout */}
                        <HStack space="md" justifyContent="space-between">
                            {/* Anketler & Oyunlaştırmalar Card */}
                            <Box
                                flex={1}
                                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                borderRadius={10}
                                p="$3"
                            >
                                <VStack space="sm" justifyContent="center">
                                    {/* Icon */}
                                    <Image
                                        source={require('@/assets/catalog/lego.png')}
                                        alt="Surveys & Gamification"
                                        width={24}
                                        height={24}
                                    />

                                    {/* Title */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize="$sm"
                                        fontWeight="$bold"
                                        textAlign="left"
                                    >
                                        {t('brandDetail.surveysAndGamification')}
                                    </Text>

                                    {/* Description */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#343434'}
                                        fontSize="$2xs"
                                        lineHeight="$xs"
                                        textAlign="left"
                                    >
                                        {t('brandDetail.surveysDescription')}
                                    </Text>

                                    {/* Button */}
                                    <Button
                                        mt='$2'
                                        bg="rgba(215, 215, 215, 0.8)"
                                        borderWidth={1}
                                        borderColor="#ADADAD"
                                        borderRadius={10}
                                        width={75}
                                        height={24}
                                        onPress={() => {
                                            if (brandId) {
                                                navigation.navigate('SurveyScreen', { brandId });
                                            }
                                        }}
                                    >
                                        <HStack alignItems="center" space="xs">
                                            <ButtonText
                                                color="#000000"
                                                fontSize="$2xs"
                                                fontWeight="$bold"
                                            >
                                                {t('brandDetail.explore')}
                                            </ButtonText>
                                            <ChevronRightIcon width={12} height={12} color="#000000" />
                                        </HStack>
                                    </Button>
                                </VStack>
                            </Box>

                            {/* Marka Ürünleri Defteri Card */}
                            <Box
                                flex={1}
                                bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                borderWidth={1}
                                borderColor="#E9E9E9"
                                borderRadius={10}
                                p="$3"
                            >
                                <VStack space="sm" justifyContent="center">
                                    {/* Icon */}
                                    <Image
                                        source={require('@/assets/catalog/book.png')}
                                        alt="Brand Products Book"
                                        width={24}
                                        height={24}
                                    />

                                    {/* Title */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize="$sm"
                                        fontWeight="$bold"
                                        textAlign="left"
                                    >
                                        {t('brandDetail.brandProductsBook')}
                                    </Text>

                                    {/* Description */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#343434'}
                                        fontSize="$2xs"
                                        lineHeight="$xs"
                                        textAlign="left"
                                    >
                                        {t('brandDetail.brandProductsBookDescription')}
                                    </Text>

                                    {/* Button */}
                                    <Button
                                        mt='$2'
                                        bg="rgba(215, 215, 215, 0.8)"
                                        borderWidth={1}
                                        borderColor="#ADADAD"
                                        borderRadius={10}
                                        width={65}
                                        height={24}
                                        onPress={() => {
                                            if (brandId) {
                                                navigation.navigate('BrandProductBookScreen', { brandId });
                                            }
                                        }}
                                    >
                                        <HStack alignItems="center" space="xs">
                                            <ButtonText
                                                color="#000000"
                                                fontSize="$2xs"
                                                fontWeight="$bold"
                                            >
                                                {t('brandDetail.view')}
                                            </ButtonText>
                                            <ChevronRightIcon width={12} height={12} color="#000000" />
                                        </HStack>
                                    </Button>
                                </VStack>
                            </Box>
                        </HStack>
                    </VStack>

                    {/* All Posts Section */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#9D9D9D'}
                                fontSize="$sm"
                                fontWeight="$bold"
                            >
                                {t('brandDetail.allPosts')}
                            </Text>
                        </HStack>

                        {/* Posts */}
                        {isBrandFeedLoading && allPosts.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                                <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$2" fontSize="$sm">
                                    {t('brandDetail.loading')}
                                </Text>
                            </Box>
                        ) : brandFeedError ? (
                            <Box py="$4" alignItems="center">
                                <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                                    {t('brandDetail.error')}: {brandFeedError.message}
                                </Text>
                            </Box>
                        ) : allPosts.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#9D9D9D'} fontSize="$sm">
                                    {t('brandDetail.noPosts')}
                                </Text>
                            </Box>
                        ) : (
                            <VStack space="sm">
                                {allPosts.map((post) => renderFeedItem(post))}
                                {/* Loading indicator for infinite scroll */}
                                {isFetchingNextBrandFeedPage && (
                                    <Box py="$4" alignItems="center">
                                        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </VStack>
                </VStack>
            </Animated.ScrollView>
        </View>
    );
};

export default BrandDetailScreen;
