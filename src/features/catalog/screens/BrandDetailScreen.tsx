import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Dimensions, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import { useSafeAreaValues } from '@/src/utils';
import { useBrandCatalog, useBrandFeed } from '../api/hooks';
import type { BrandFeedPost } from '../types';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import { CardType } from '@/src/types/common';
import { toImageSource } from '@/src/utils';

const { width } = Dimensions.get('window');

type BrandDetailScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'BrandDetailScreen'>;
type BrandDetailScreenRouteProp = RouteProp<CatalogStackParamList, 'BrandDetailScreen'>;

const BrandDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<BrandDetailScreenNavigationProp>();
    const route = useRoute<BrandDetailScreenRouteProp>();
    const scrollY = useRef(new Animated.Value(0)).current;
    const bottomInset = useSafeAreaValues('bottom');

    // Route params'dan brandId'yi güvenli şekilde al
    const brandId = route.params?.brandId;
    
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
    } = useBrandFeed(brandId, 3);

    // Map BrandFeedPost to PostCardData (Feed/Post type için)
    const mapBrandPostToPostCardData = useCallback((post: BrandFeedPost): PostCardData => {
        const postData = post.data;
        const avatarSource = toImageSource(postData.user.avatar);
        
        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource || require('@/assets/avatar/ozan.png'),
            },
            content: postData.content,
            images: postData.images?.map(img => img) || [],
            stats: {
                likes: postData.stats.likes,
                comments: postData.stats.comments,
                shares: postData.stats.shares,
                bookmarks: postData.stats.bookmarks,
            },
            createdAt: postData.createdAt,
            contextType: postData.contextType as any,
            contextData: postData.contextData ? {
                id: postData.contextData.id,
                name: postData.contextData.name,
                subName: postData.contextData.subName,
                image: postData.contextData.image,
                isOwned: false, // API'den gelmiyor, default false
            } : undefined,
        };
    }, []);

    // Map Experience (ReviewApiItem) to ReviewCardData
    const mapExperienceToCardData = useCallback((item: BrandFeedPost & { type: 'experience' }): ReviewCardData => {
        const postData = item.data as any; // ReviewApiItem structure
        const avatarSource = toImageSource(postData.user.avatar)!;
        const productImage = postData.contextData?.image
            ? toImageSource(postData.contextData.image)
            : undefined;

        const content: ReviewCardContentItem[] = postData.content.map((contentItem: any) => ({
            tag: {
                icon: 'tag',
                title: contentItem.title,
            },
            text: contentItem.content,
            rating: Array(5)
                .fill(false)
                .map((_, index) => index < (contentItem.rating || 0)),
        }));

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
    const mapBenchmarkToCardData = useCallback((item: BrandFeedPost & { type: 'benchmark' }): BenchmarkCardData => {
        const postData = item.data as any; // BenchmarkApiItem structure
        const avatarSource = toImageSource(postData.user.avatar)!;

        const products: BenchmarkProduct[] = postData.products.map((p: any) => ({
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
            content: postData.content,
            stats: postData.stats,
            createdAt: postData.createdAt,
        };
    }, []);

    // Map Tips to TipsCardData
    const mapTipsToCardData = useCallback((item: BrandFeedPost & { type: 'tipsAndTricks' }): TipsCardData => {
        const postData = item.data as any; // TipsApiItem structure
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
            content: postData.content,
            images: postData.images
                ?.map((img: string) => toImageSource(img))
                .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource),
            stats: postData.stats,
            tag: postData.tag,
            createdAt: postData.createdAt,
        };
    }, []);

    // Map Question to QuestionCardData
    const mapQuestionToCardData = useCallback((item: BrandFeedPost & { type: 'question' }): QuestionCardData => {
        const postData = item.data as any; // QuestionApiItem structure
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

        return {
            id: postData.id,
            user: {
                id: postData.user.id,
                name: postData.user.name,
                title: postData.user.title,
                avatar: avatarSource,
            },
            category,
            content: postData.content,
            isBoosted: postData.isBoosted,
            images: postData.images
                ?.map((img: string) => toImageSource(img))
                .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource),
            stats: postData.stats,
            createdAt: postData.createdAt,
        };
    }, []);

    // Transform brand feed posts data for display (flatten all pages and remove duplicates)
    const allPosts = useMemo(() => {
        if (!brandFeedData?.pages) return [];
        
        const allItems = brandFeedData.pages.flatMap((page) => page.posts);
        
        // Remove duplicates by ID (cursor pagination'da aynı item tekrar gelebilir)
        const uniqueItemsMap = new Map<string, BrandFeedPost>();
        for (const item of allItems) {
            if (!uniqueItemsMap.has(item.data.id)) {
                uniqueItemsMap.set(item.data.id, item);
            }
        }
        
        return Array.from(uniqueItemsMap.values());
    }, [brandFeedData?.pages]);

    // Render feed item based on type (similar to FeedScreen)
    const renderFeedItem = useCallback((item: BrandFeedPost) => {
        console.log(item.type === CardType.EXPERIENCE ? "Experience Rednder Edildi." : "Düz Card");
        console.log(item.type === CardType.EXPERIENCE ? item.data : "");
        switch (item.type) {
            case CardType.EXPERIENCE:
                // Experience type için ReviewApiItem kullan ve ExperiencePostCard render et
                if ('content' in item.data && Array.isArray(item.data.content)) {
                    return (
                        <ExperiencePostCard
                            key={item.data.id}
                            data={mapExperienceToCardData(item as BrandFeedPost & { type: 'experience' })}
                        />
                    );
                }
                return null;
            case CardType.FEED:
            case CardType.POST:
                // Feed/Post type için PostCard render et
                return (
                    <PostCard
                        key={item.data.id}
                        data={mapBrandPostToPostCardData(item)}
                    />
                );
            case CardType.BENCHMARK:
                return (
                    <BenchmarkPostCard
                        key={item.data.id}
                        data={mapBenchmarkToCardData(item as BrandFeedPost & { type: 'benchmark' })}
                    />
                );
            case CardType.QUESTION:
                // Question type kontrolü
                if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
                    return (
                        <QuestionPostCard
                            key={item.data.id}
                            data={mapQuestionToCardData(item as BrandFeedPost & { type: 'question' })}
                        />
                    );
                }
                return null;
            case CardType.TIPS_AND_TRICKS:
                return (
                    <TipsAndTricksPostCard
                        key={item.data.id}
                        data={mapTipsToCardData(item as BrandFeedPost & { type: 'tipsAndTricks' })}
                    />
                );
            case CardType.UPDATE:
                // UpdatePostCard için şimdilik null döndür
                return null;
            default:
                return null;
        }
    }, [mapBrandPostToPostCardData, mapExperienceToCardData, mapBenchmarkToCardData, mapQuestionToCardData, mapTipsToCardData]);

    // Banner yüksekliği ve içerik başlangıç noktası
    const BANNER_HEIGHT = 250;
    const CONTENT_OFFSET = 20; // mt={-20} nedeniyle içerik banner'ın 20px üstünde başlıyor
    const CONTENT_START = BANNER_HEIGHT - CONTENT_OFFSET; // 230px

    const handleScroll = useCallback((event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollY.setValue(offsetY);
        
        // Infinite scroll: ScrollView'in altına yaklaştığında yeni sayfa yükle
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 300; // ScrollView'in altına yaklaşma mesafesi
        const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

        if (isCloseToBottom && hasNextBrandFeedPage && !isFetchingNextBrandFeedPage) {
            fetchNextBrandFeedPage();
        }
    }, [hasNextBrandFeedPage, isFetchingNextBrandFeedPage, fetchNextBrandFeedPage, allPosts.length]);


    // Header animasyonu: İçeriğin başlangıç noktasına yaklaştığında açılır
    // 100px'de başlar, 180px'de tamamen görünür olur
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100, 180],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp',
    });
    
    // Debug: Opacity değerini takip et
    useEffect(() => {
        const listenerId = scrollY.addListener(({ value }) => {
            let opacity = 0;
            if (value >= 100 && value < 180) {
                opacity = (value - 100) / (180 - 100);
            } else if (value >= 180) {
                opacity = 1;
            }
        });
        
        return () => {
            scrollY.removeListener(listenerId);
        };
    }, [headerOpacity]);

    // Loading state
    if (isBrandCatalogLoading) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$4">
                        Yükleniyor...
                    </Text>
                </Box>
            </SafeAreaView>
        );
    }

    // Error state
    if (brandCatalogError || !brandCatalog) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title="Brand Not Found"
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                        <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                            {brandCatalogError ? `Hata: ${brandCatalogError.message}` : 'Marka bulunamadı'}
                        </Text>
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Sticky Animated Header */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    elevation: 10,
                    pointerEvents: 'box-none',
                }}
                collapsable={false}
            >
                <Animated.View
                    style={{
                        opacity: headerOpacity,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        zIndex: 9999,
                        elevation: 10,
                    }}
                >
                    <Box 
                        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
                        width="100%"
                    >
                        <Header
                            title={brandCatalog.name}
                            showBackButton={true}
                            onBackPress={() => navigation.goBack()}
                            showShare={true}
                            onSharePress={() => console.log('Share pressed')}
                        />
                    </Box>
                </Animated.View>
            </Animated.View>

            <Animated.ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={400}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
            >
                {/* Banner Image */}
                <Box
                    width={width}
                    height={250}
                    position="relative"
                    overflow="hidden"
                >
                    <Image
                        source={toImageSource(brandCatalog.bannerImage) || require('@/assets/banner/banner_01.png')}
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

                    {/* Back and Share Buttons */}
                    <HStack
                        position="absolute"
                        top={25}
                        left={16}
                        right={16}
                        justifyContent="space-between"
                        alignItems="center"
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
                            <Feather name="arrow-left" size={20} color="#FFFFFF" />
                        </Pressable>

                        <Pressable
                            width={36}
                            height={36}
                            borderRadius={18}
                            bg="rgba(0, 0, 0, 0.6)"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Feather name="share-2" size={20} color="#FFFFFF" />
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
                            fontSize={9}
                            lineHeight={12}
                            mb="$2"
                        >
                            Discover all experiences related to {brandCatalog.name}.
                        </Text>
                    </VStack>
                </Box>

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
                                fontSize={18}
                                fontWeight="$bold"
                                mb="$1"
                            >
                                {brandCatalog.name}
                            </Text>
                            <HStack alignItems="center" space="sm">
                                <Feather name="users" size={12} color="#9D9D9D" />
                                <Text
                                    color="#9D9D9D"
                                    fontSize={9}
                                    fontWeight="$medium"
                                >
                                    {brandCatalog.followers} Followers
                                </Text>
                            </HStack>
                        </VStack>
                        <Button
                            bg={brandCatalog.isJoined ? "rgba(215, 215, 215, 0.8)" : "#C2E607"}
                            borderRadius={10}
                            width={65}
                            height={24}
                            onPress={() => console.log(brandCatalog.isJoined ? 'Leave' : 'Join')}
                        >
                            <ButtonText
                                color="#000000"
                                fontSize={9}
                                fontWeight="$bold"
                                textAlign="center"
                            >
                                {brandCatalog.isJoined ? 'Leave' : 'Join'}
                            </ButtonText>
                        </Button>
                    </HStack>

                    {/* Brand Description */}
                    <Text
                        color={isDark ? '#FFFFFF' : '#343434'}
                        fontSize={9}
                        lineHeight={12}
                        mb="$4"
                    >
                        {brandCatalog.description}
                    </Text>

                    {/* Browse Section */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#9D9D9D'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                Browse
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
                                        alt="Anketler & Oyunlaştırmalar"
                                        width={24}
                                        height={24}
                                    />

                                    {/* Title */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={12}
                                        fontWeight="$bold"
                                        textAlign="left"
                                    >
                                        Anketler & Oyunlaştırmalar
                                    </Text>

                                    {/* Description */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#343434'}
                                        fontSize={9}
                                        lineHeight={12}
                                        textAlign="left"
                                    >
                                        Anketler ve Oyunlaştırmalar hakkında küçük bir yazı
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
                                        onPress={() => navigation.navigate('SurveyScreen')}
                                    >
                                        <HStack alignItems="center" space="xs">
                                            <ButtonText
                                                color="#000000"
                                                fontSize={9}
                                                fontWeight="$bold"
                                            >
                                                Explore
                                            </ButtonText>
                                            <Feather name="chevron-right" size={12} color="#000000" />
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
                                        alt="Marka Ürünleri Defteri"
                                        width={24}
                                        height={24}
                                    />

                                    {/* Title */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={12}
                                        fontWeight="$bold"
                                        textAlign="left"
                                    >
                                        Marka Ürünleri Defteri
                                    </Text>

                                    {/* Description */}
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#343434'}
                                        fontSize={9}
                                        lineHeight={12}
                                        textAlign="left"
                                    >
                                        Marka Ürünleri Defteri hakkında küçük bir yazı
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
                                                fontSize={9}
                                                fontWeight="$bold"
                                            >
                                                View
                                            </ButtonText>
                                            <Feather name="chevron-right" size={12} color="#000000" />
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
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                All Posts
                            </Text>
                        </HStack>

                        {/* Posts */}
                        {isBrandFeedLoading && allPosts.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                                <Text color={isDark ? '#FFFFFF' : '#000000'} mt="$2" fontSize={12}>
                                    Yükleniyor...
                                </Text>
                            </Box>
                        ) : brandFeedError ? (
                            <Box py="$4" alignItems="center">
                                <Text color="#CE4A4A" fontSize={12} textAlign="center">
                                    Hata: {brandFeedError.message}
                                </Text>
                            </Box>
                        ) : allPosts.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#9D9D9D'} fontSize={12}>
                                    Henüz post bulunmuyor
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
        </Box>
        </SafeAreaView>
    );
};

export default BrandDetailScreen;
