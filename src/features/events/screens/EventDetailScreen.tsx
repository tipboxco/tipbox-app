import React, { useState, useRef, useCallback } from 'react';
import { Platform, FlatList, ActivityIndicator } from 'react-native';
import { ScrollView, Dimensions, Animated } from 'react-native';
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
import type { EventsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { useEventDetail, useEventPosts } from '../api/hooks';
import { toImageSource } from '@/src/utils';
import { CardType, EventStatus } from '@/src/types/common';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';

const { width } = Dimensions.get('window');

type EventDetailScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'EventDetail'>;
type EventDetailScreenRouteProp = RouteProp<EventsStackParamList, 'EventDetail'>;

const EventDetailScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<EventDetailScreenNavigationProp>();
    const route = useRoute<EventDetailScreenRouteProp>();
    const scrollY = useRef(new Animated.Value(0)).current;

    const { eventId } = route.params;

    // Fetch event detail from API
    const { data: event, isLoading, error } = useEventDetail(eventId);
    
    // Fetch event posts from API
    const {
        data: postsData,
        fetchNextPage: fetchNextPostsPage,
        hasNextPage: hasNextPostsPage,
        isFetchingNextPage: isFetchingNextPostsPage,
        isLoading: isPostsLoading,
        error: postsError,
    } = useEventPosts(eventId, 20);
    
    // Flatten all pages into a single array
    const feedItems = postsData?.pages.flatMap((page) => page.items) ?? [];
    
    // Local state for join button (can be synced with API's isJoined later)
    const [isJoined, setIsJoined] = useState(false);

    // Format date range from startDate and endDate
    const formatDateRange = (startDate: string, endDate: string): string => {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            
            const formatDate = (date: Date): string => {
                const day = date.getDate().toString().padStart(2, '0');
                const month = months[date.getMonth()];
                const year = date.getFullYear();
                return `${day} ${month} ${year}`;
            };

            return `${formatDate(start)} - ${formatDate(end)}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    // Sync isJoined with API response
    React.useEffect(() => {
        if (event?.isJoined !== undefined) {
            setIsJoined(event.isJoined);
        }
    }, [event?.isJoined]);

    // Map Feed/Post to PostCardData (from FeedScreen)
    const mapFeedToCardData = (item: ProfilePost): PostCardData => {
        // content array ise string'e çevir, değilse direkt kullan
        const contentString = Array.isArray(item.content)
            ? item.content.map((contentItem) => contentItem.content || '').join(' ')
            : (item.content || '');

        return {
            id: item.id,
            user: {
                id: item.user.id,
                name: item.user.name,
                title: item.user.title,
                avatar: toImageSource(item.user.avatar)!,
            },
            content: contentString,
            images: item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
            stats: item.stats,
            createdAt: item.createdAt,
            contextType: item.contextType,
            contextData: item.contextData,
        };
    };

    // Map Benchmark to BenchmarkCardData (from FeedScreen)
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

    // Map Tips to TipsCardData (from FeedScreen)
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
            createdAt: item.createdAt,
        };
    };

    // Map Question to QuestionCardData (from FeedScreen)
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
            images: item.images
                ?.map((img) => toImageSource(img))
                .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
            stats: item.stats,
            createdAt: item.createdAt,
        };
    };

    // Render feed item based on type (from FeedScreen)
    const renderFeedItem = (item: FeedApiItem) => {
        switch (item.type) {
            case CardType.FEED:
            case CardType.POST:
                return (
                    <PostCard
                        key={item.data.id}
                        data={mapFeedToCardData(item.data as ProfilePost)}
                    />
                );
            case CardType.BENCHMARK:
                return (
                    <BenchmarkPostCard
                        key={item.data.id}
                        data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
                    />
                );
            case CardType.QUESTION:
                if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
                    return (
                        <QuestionPostCard
                            key={item.data.id}
                            data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
                        />
                    );
                }
                return null;
            case CardType.TIPS_AND_TRICKS:
                return (
                    <TipsAndTricksPostCard
                        key={item.data.id}
                        data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
                    />
                );
            default:
                return null;
        }
    };

    // Handle load more posts
    const handleLoadMore = useCallback(() => {
        if (hasNextPostsPage && !isFetchingNextPostsPage) {
            fetchNextPostsPage();
        }
    }, [hasNextPostsPage, isFetchingNextPostsPage, fetchNextPostsPage]);

    // Banner yüksekliği ve içerik başlangıç noktası
    const BANNER_HEIGHT = 250;
    const CONTENT_OFFSET = 20; // mt={-20} nedeniyle içerik banner'ın 20px üstünde başlıyor
    const CONTENT_START = BANNER_HEIGHT - CONTENT_OFFSET; // 230px

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
    );

    // Header animasyonu: İçeriğin başlangıç noktasına yaklaştığında açılır
    // 180px'de başlar, 230px'de (içerik başlangıcı) tamamen görünür olur
    const headerOpacity = scrollY.interpolate({
        inputRange: [180, CONTENT_START],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title="Loading..."
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} alignItems="center" justifyContent="center">
                        <Text color={isDark ? '#FFFFFF' : '#000000'}>Yükleniyor...</Text>
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !event) {
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                    <Header
                        title="Event Not Found"
                        showBackButton={true}
                        onBackPress={() => navigation.goBack()}
                    />
                    <Box flex={1} alignItems="center" justifyContent="center">
                        <Text color={isDark ? '#FFFFFF' : '#000000'}>
                            {error ? 'Event yüklenirken bir hata oluştu' : 'Event bulunamadı'}
                        </Text>
                    </Box>
                </Box>
            </SafeAreaView>
        );
    }

    const dateRange = formatDateRange(event.startDate, event.endDate);
    const bannerImageSource = event.bannerImage ? toImageSource(event.bannerImage) : require('@/assets/events/banner.png');
    const participantAvatars = event.participants?.map(p => p.avatar) || [];

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* Sticky Animated Header */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    opacity: headerOpacity,
                }}
            >
                <Header
                    title={event.title}
                    showBackButton={true}
                    onBackPress={() => navigation.goBack()}
                    showShare={true}
                    onSharePress={() => console.log('Share pressed')}
                />
            </Animated.View>

            <ScrollView
                onScroll={(event) => {
                    handleScroll(event);
                    // Infinite scroll için scroll pozisyonunu kontrol et
                    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                    const paddingToBottom = 20;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                    
                    if (isCloseToBottom && hasNextPostsPage && !isFetchingNextPostsPage) {
                        handleLoadMore();
                    }
                }}
                scrollEventThrottle={16}
            >
                {/* Banner Image */}
                <Box
                    width={width}
                    height={250}
                    position="relative"
                    overflow="hidden"
                >
                    <Image
                        source={bannerImageSource}
                        alt="Event Banner"
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
                </Box>

                {/* Content */}
                <VStack
                    bg={isDark ? '#000000' : '#FAFAFA'}
                    borderTopLeftRadius={20}
                    borderTopRightRadius={20}
                    mt={-20}
                    flex={1}
                    px={15}
                    pt={15}
                >
                    {/* Event Type Badge */}
                    <Box mb="$2">
                        <Box
                            bg="rgba(144, 8, 255, 0.8)"
                            borderWidth={1}
                            borderColor="#CA88FF"
                            borderRadius={10}
                            px="$2"
                            py="$1"
                            alignSelf="flex-start"
                        >
                            <Text
                                color="#FFFFFF"
                                fontSize={9}
                                fontWeight="$bold"
                            >
                                {event.eventType}
                            </Text>
                        </Box>
                    </Box>

                    <HStack justifyContent="space-between" alignItems="center" mb="$2">
                        {/* Event Title */}
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={16}
                            fontWeight="$bold"
                        >
                            {event.title}
                        </Text>
                        <Button
                            bg={isJoined ? '#D9D9D9' : '#C2E607'}
                            borderRadius={5}
                            h={20}
                            isDisabled={event.status === EventStatus.UPCOMING}
                            onPress={() => setIsJoined(!isJoined)}
                        >
                            <ButtonText
                                color="#000000"
                                fontSize={10}
                                fontWeight="$bold"
                                textAlign="center"
                            >
                                {isJoined ? 'Joined' : 'Join'}
                            </ButtonText>
                        </Button>
                    </HStack>

                    {/* Event Description */}
                    <Text
                        color={isDark ? '#FFFFFF' : '#343434'}
                        fontSize={10}
                        lineHeight={12}
                        mb="$3"
                    >
                        {event.description}
                    </Text>

                    {/* Details Section */}
                    <VStack space="xs" mb="$3">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={12}
                            fontWeight="$bold"
                        >
                            Details
                        </Text>

                        <Box
                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            borderRadius={5}
                            px="$4"
                            py="$3"
                        >
                            <VStack space="md">
                                {/* Duration */}
                                <HStack alignItems="center" space="sm">
                                    <Box
                                        width={30}
                                        height={30}
                                        borderRadius={15}
                                        borderWidth={1}
                                        borderColor="#B9B9B9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Feather name="calendar" size={16} color="#B9B9B9" />
                                    </Box>
                                    <VStack>
                                        <Text
                                            color="#B9B9B9"
                                            fontSize={11}
                                            fontWeight="$medium"
                                        >
                                            Duration
                                        </Text>
                                        <Text
                                            color="#000000"
                                            fontSize={11}
                                            fontWeight="$bold"
                                        >
                                            {dateRange}
                                        </Text>
                                    </VStack>
                                </HStack>

                                {/* Participants */}
                                <HStack alignItems="center" space="sm">
                                    <Box
                                        width={30}
                                        height={30}
                                        borderRadius={15}
                                        borderWidth={1}
                                        borderColor="#B9B9B9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Feather name="users" size={16} color="#B9B9B9" />
                                    </Box>
                                    <VStack>
                                        <Text
                                            color="#B9B9B9"
                                            fontSize={11}
                                            fontWeight="$medium"
                                        >
                                            Participants
                                        </Text>
                                        <Text
                                            color="#000000"
                                            fontSize={11}
                                            fontWeight="$bold"
                                        >
                                            {event.interaction}+ people joined
                                        </Text>
                                    </VStack>
                                </HStack>
                            </VStack>
                        </Box>
                    </VStack>

                    {/* Rewards & Badges Section */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                Rewards & Badges
                            </Text>
                            <Pressable
                                onPress={() => navigation.navigate('RewardsBadges')}
                            >
                                <Text
                                    color={isDark ? '#FFFFFF' : '#000000'}
                                    fontSize={9}
                                    fontWeight="$bold"
                                    underline
                                >
                                    See All
                                </Text>
                            </Pressable>
                        </HStack>

                        {/* Badge Cards - Horizontal Scroll */}
                        {event.rewards && event.rewards.length > 0 ? (
                            <FlatList
                                data={event.rewards}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                ItemSeparatorComponent={() => <Box width={6} />}
                                contentContainerStyle={{ paddingRight: 16 }}
                                renderItem={({ item }) => {
                                    const imageSource = toImageSource(item.image);
                                    return (
                                        <Box
                                            width={108}
                                            height={122}
                                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                            borderWidth={1}
                                            borderColor="#E9E9E9"
                                            borderRadius={5}
                                            alignItems="center"
                                            justifyContent="center"
                                            p="$3"
                                        >
                                            {imageSource ? (
                                                <Image
                                                    source={imageSource}
                                                    alt={item.title}
                                                    width={62}
                                                    height={62}
                                                    borderRadius={5}
                                                    mb="$2"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Box
                                                    width={62}
                                                    height={62}
                                                    bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                                    borderRadius={5}
                                                    mb="$2"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    <Feather
                                                        name="award"
                                                        size={24}
                                                        color={isDark ? '#666' : '#999'}
                                                    />
                                                </Box>
                                            )}
                                            <Text
                                                color={isDark ? '#FFFFFF' : '#000000'}
                                                fontSize={10}
                                                fontWeight="$bold"
                                                textAlign="center"
                                            >
                                                {item.title}
                                            </Text>
                                        </Box>
                                    );
                                }}
                                keyExtractor={(item) => item.id}
                            />
                        ) : (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize={12}>
                                    Henüz ödül bulunmuyor
                                </Text>
                            </Box>
                        )}
                    </VStack>

                    {/* Event Feed Section */}
                    <VStack space="xs" mt="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                Event Feed
                            </Text>
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={10}
                                fontWeight="$bold"
                                underline
                            >
                                Latest
                            </Text>
                        </HStack>

                        {/* Event Feed Cards */}
                        {isPostsLoading && feedItems.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            </Box>
                        ) : postsError ? (
                            <Box py="$4" alignItems="center">
                                <Text color="#CE4A4A" fontSize={12}>
                                    Postlar yüklenirken bir hata oluştu
                                </Text>
                            </Box>
                        ) : feedItems.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize={12}>
                                    Henüz post bulunmuyor
                                </Text>
                            </Box>
                        ) : (
                            <VStack space="sm">
                                {feedItems.map((item) => renderFeedItem(item))}
                                {isFetchingNextPostsPage && (
                                    <Box py="$4" alignItems="center">
                                        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Floating Action Button */}
            {isJoined && (
                <Box
                    position="absolute"
                    bottom={Platform.OS === 'ios' ? 34 + 8 : 45 + 8}
                    right={16}
                    zIndex={1000}
                >
                    <Pressable
                        bg="#E8FF6B"
                        borderRadius={30}
                        width={56}
                        height={56}
                        alignItems="center"
                        justifyContent="center"
                        shadowColor="#000"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.3}
                        shadowRadius={4.65}
                        elevation={8}
                        onPress={() => {
                            // eventType === 'product' ise product prop'u gönder, değilse undefined
                            // EventProduct tipine uygun hale getir (image field'ı ekle)
                            const product = event.eventType === 'product' && event.product
                                ? {
                                    id: event.product.id,
                                    name: event.product.name,
                                    image: null, // API'den image gelmiyor, null olarak gönder
                                    category: undefined,
                                }
                                : undefined;
                            
                            // eventType'ı EventType enum'una map et
                            // 'default' -> undefined (EventCreatePost'da seçilecek)
                            // 'product' -> EventType.TYPE2 (product event)
                            const eventTypeForNav = event.eventType === 'product' 
                                ? 'Type2' as any // EventType.TYPE2
                                : undefined;
                            
                            navigation.navigate('EventCreatePost', {
                                eventType: eventTypeForNav,
                                product: product,
                            });
                        }}
                    >
                        <Feather name="edit-3" size={24} color="#000000" />
                    </Pressable>
                </Box>
            )}
        </Box>
        </SafeAreaView>
    );
};

export default EventDetailScreen;
