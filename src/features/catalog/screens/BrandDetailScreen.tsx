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
import { useSafeAreaValues } from '@/src/utils';
import { useBrandCatalog, useBrandFeed } from '../api/hooks';
import type { BrandCatalogPost, BrandFeedPost } from '../types';
import type { PostCardData } from '@/src/types/PostCard';
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

    // Map BrandCatalogPost or BrandFeedPost to PostCardData
    const mapBrandPostToPostCardData = useCallback((post: BrandCatalogPost | BrandFeedPost): PostCardData => {
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

    // Map posts to PostCardData format
    const mappedPosts = useMemo(() => {
        return allPosts.map(mapBrandPostToPostCardData);
    }, [allPosts, mapBrandPostToPostCardData]);

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
    }, [hasNextBrandFeedPage, isFetchingNextBrandFeedPage, fetchNextBrandFeedPage, mappedPosts.length]);


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
                        {isBrandFeedLoading && mappedPosts.length === 0 ? (
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
                        ) : mappedPosts.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#9D9D9D'} fontSize={12}>
                                    Henüz post bulunmuyor
                                </Text>
                            </Box>
                        ) : (
                            <VStack space="sm">
                                {mappedPosts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        data={post}
                                    />
                                ))}
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
