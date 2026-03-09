import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolateColor,
    withTiming,
} from 'react-native-reanimated';
import {
    VStack,
    HStack,
    Text,
    Pressable,
    Box,
    Image,
    Input,
    InputField,
    ScrollView
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { FunnelIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { Header } from '@/src/components/Header';
import { TrustUser as ApiTrustUser, TrusterUser as ApiTrusterUser } from '@/src/features/profile/types';
import { TrustUserCard, TrustUserCardUser } from '../components/TrustUserCard';
import { SuggestionCard } from '../components/SuggestionCard';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useTrustList, useTrusterList, useUserProfile } from '../api/hooks';
import { ProfileStackParamList } from '../navigation';
import { useSafeAreaValues, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useTranslation } from '@/src/hooks/useTranslation';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

type TrustListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TrustListScreenRouteProp = {
    key: string;
    name: string;
    params: {
        userId: string;
        initialTab?: 'trust' | 'truster';
    };
};


export const Trust_TrusterListScreen = () => {
    const { t } = useTranslation('profile');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const route = useRoute<TrustListScreenRouteProp>();
    const navigation = useNavigation<TrustListScreenNavigationProp>();
    const profileNavigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const bottomInset = useSafeAreaValues('bottom');

    const userId = route.params?.userId;
    const initialTab = route.params?.initialTab || 'trust';
    const initialPage = initialTab === 'truster' ? 1 : 0;
    
    // PagerView refs and state
    const pagerRef = useRef<PagerView>(null);
    const tabContainerRef = useRef<any>(null);
    const [tabContainerWidth, setTabContainerWidth] = useState(0);
    const [currentPage, setCurrentPage] = useState(initialPage);
    
    // 🎯 CORE: Shared progress value (0 = Trust, 1 = Truster)
    const progress = useSharedValue(initialPage);
    
    const [activeTab, setActiveTab] = useState<'trust' | 'truster'>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedSort, setSelectedSort] = useState<'default' | 'newest' | 'oldest'>('default');
    
    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

    // Get user profile for header title
    const { data: userProfile } = useUserProfile(userId);

    // Debounce search query - Trust sekmesi için API'ye istek atmadan önce 500ms bekle
    useEffect(() => {
        if (activeTab === 'trust') {
            const timer = setTimeout(() => {
                setDebouncedSearchQuery(searchQuery);
            }, 500);

            return () => clearTimeout(timer);
        } else {
            // Truster sekmesinde debounce yok, direkt kullan
            setDebouncedSearchQuery(searchQuery);
        }
    }, [searchQuery, activeTab]);

    // React Query hook - her zaman aktif (cache'den veri göster, tab değişiminde yeni istek atma)
    // Sadece search query değiştiğinde veya pull to refresh'te yeni istek atılacak
    const { 
        data: trustListData, 
        isLoading: isTrustListLoading, 
        isPending: isTrustListPending,
        isFetching: isTrustListFetching,
        error: trustListError,
        refetch: refetchTrustList,
        isRefetching: isRefetchingTrustList
    } = useTrustList(
        userId, // Her zaman userId geçir (cache'den veri göster)
        activeTab === 'trust' ? (debouncedSearchQuery.trim() || undefined) : undefined // Sadece trust tab'ında search query kullan
    );

    // React Query hook - her zaman aktif (cache'den veri göster, tab değişiminde yeni istek atma)
    const { 
        data: trusterListData, 
        isLoading: isTrusterListLoading, 
        isPending: isTrusterListPending,
        isFetching: isTrusterListFetching,
        error: trusterListError,
        refetch: refetchTrusterList,
        isRefetching: isRefetchingTrusterList
    } = useTrusterList(
        userId, // Her zaman userId geçir (cache'den veri göster)
        activeTab === 'truster' ? (debouncedSearchQuery.trim() || undefined) : undefined, // Sadece truster tab'ında search query kullan
        activeTab === 'truster' ? (selectedSort === 'newest' ? 'date_desc' : selectedSort === 'oldest' ? 'date_asc' : undefined) : undefined
    );

    // userId yoksa veya cache'den data varsa loading gösterme
    const shouldShowTrustLoading = !!userId && (isTrustListLoading || isTrustListPending) && !trustListData;
    const shouldShowTrusterLoading = !!userId && (isTrusterListLoading || isTrusterListPending) && !trusterListData;

    // API'den gelen data'yı mock formatına transform et (sadece TrustUserCard için gerekli)
    const transformTrustApiUserToCardUser = (apiUser: ApiTrustUser): TrustUserCardUser => {
        return {
            id: apiUser.id,
            name: apiUser.name,
            title: apiUser.titles?.[0] || '', // İlk title'ı kullan
            avatar: apiUser.avatar ? { uri: apiUser.avatar } : DEFAULT_USER_AVATAR, // String URL'yi Image source formatına çevir, yoksa default avatar
            trustLevel: 3, // Varsayılan trust level (API'de yok)
            isOnline: false, // Varsayılan
        };
    };

    const transformTrusterApiUserToCardUser = (apiUser: ApiTrusterUser): TrustUserCardUser => {
        return {
            id: apiUser.id,
            name: apiUser.name,
            title: apiUser.titles?.[0] || '',
            avatar: apiUser.avatar ? { uri: apiUser.avatar } : DEFAULT_USER_AVATAR, // Yoksa default avatar
            trustLevel: 3,
            isOnline: false,
        };
    };

    // Trust sekmesi için veriler - her zaman hesapla (PagerView içinde her iki tab da render ediliyor)
    const trustUsers: TrustUserCardUser[] = (trustListData?.map(transformTrustApiUserToCardUser) || []);

    // Truster sekmesi için veriler - her zaman hesapla
    const trusterUsers: TrustUserCardUser[] = (trusterListData?.map(transformTrusterApiUserToCardUser) || []);

    // Trust sekmesi için filtrelenmiş kullanıcılar (backend'den filtrelenmiş veri geliyor, direkt kullan)
    const filteredTrustUsers = trustUsers;

    // Truster sekmesi için filtrelenmiş kullanıcılar (frontend'de filtrele)
    const filteredTrusterUsers = trusterUsers.filter((user: TrustUserCardUser) => {
        return user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Trust sekmesinde search query varsa ve data boşsa, "Kullanıcı bulunamadı" göster
    const showTrustEmptyState = !isTrustListLoading && !trustListError && debouncedSearchQuery.trim().length > 0 && filteredTrustUsers.length === 0;
    
    // Truster sekmesinde search query varsa ve data boşsa, "Kullanıcı bulunamadı" göster
    const showTrusterEmptyState = !isTrusterListLoading && !trusterListError && searchQuery.trim().length > 0 && filteredTrusterUsers.length === 0;

    // Tab press handler
    const handleTabPress = useCallback((index: number) => {
        pagerRef.current?.setPage(index);
    }, []);

    // Page scroll handler (realtime progress)
    const handlePageScroll = useCallback(
        (e: any) => {
            'worklet';
            const { position, offset } = e.nativeEvent;
            progress.value = position + offset;
        },
        [progress]
    );

    // Page selected handler (snap sonrası sync)
    const handlePageSelected = useCallback(
        (e: any) => {
            const position = e.nativeEvent.position;
            progress.value = withTiming(position, { duration: 0 });
            setCurrentPage(position);
            setActiveTab(position === 0 ? 'trust' : 'truster');
        },
        [progress]
    );

    // Animated styles for tab labels
    const trustTabStyle = useAnimatedStyle(() => {
        const activeColor = isDark ? '#FFFFFF' : '#000000';
        const inactiveColor = '#8C8C8C';
        const color = interpolateColor(
            progress.value,
            [0, 1], // Progress range
            [activeColor, inactiveColor] // Trust: active -> inactive
        );
        return { color };
    });

    const trusterTabStyle = useAnimatedStyle(() => {
        const activeColor = isDark ? '#FFFFFF' : '#000000';
        const inactiveColor = '#8C8C8C';
        const color = interpolateColor(
            progress.value,
            [0, 1], // Progress range
            [inactiveColor, activeColor] // Truster: inactive -> active
        );
        return { color };
    });

    // Indicator animation
    const numberOfTabs = 2;
    const tabWidth = tabContainerWidth / numberOfTabs || 0;
    const indicatorWidth = tabWidth * 0.8; // Tab genişliğinin %80'i

    const indicatorStyle = useAnimatedStyle(() => {
        // Her tab'in ortasına yerleştirmek için
        const translateX = progress.value * tabWidth + (tabWidth - indicatorWidth) / 2;
        return {
            transform: [{ translateX }],
        };
    });

    // Background color - NotificationsScreen ile aynı yapı
    const backgroundColor = isDark ? '#000' : '#FFFFFF';
    const tabHeaderBgColor = '#FFFFFF'; // Tab header her zaman beyaz


    const handleSortSelect = (sort: 'default' | 'newest' | 'oldest') => {
        setSelectedSort(sort);
        closeBottomSheet();
    };

    // Pull to refresh handler - cache invalid yap ve fresh data fetch et
    const handleRefreshTrust = useCallback(async () => {
        await refetchTrustList();
    }, [refetchTrustList]);

    const handleRefreshTruster = useCallback(async () => {
        await refetchTrusterList();
    }, [refetchTrusterList]);

    const handleFilterPress = () => {
        openBottomSheet(
            <VStack flex={1} px={16} py={20}>
                {/* Sort Header */}
                <HStack justifyContent="center" mb={20}>
                    <Text
                        color={isDark ? '#fff' : '#000'}
                        fontSize="$md"
                        fontWeight="$bold"
                    >
                        {t('trustList.sort')}
                    </Text>
                </HStack>

                {/* Sort Options */}
                <VStack space="md">
                    {/* Default Option */}
                    <Pressable onPress={() => handleSortSelect('default')}>
                        <HStack
                            alignItems="center"
                            justifyContent="space-between"
                            py={10}
                        >
                            <Text
                                color={isDark ? '#fff' : '#000'}
                                fontSize="$sm"
                                fontWeight="$normal"
                            >
                                {t('trustList.sortDefault')}
                            </Text>
                            <Box
                                width={20}
                                height={20}
                                borderRadius={10}
                                borderWidth={1}
                                borderColor="#B8B8B7"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {selectedSort === 'default' && (
                                    <Box
                                        width={14}
                                        height={14}
                                        borderRadius={7}
                                        bg="#B8B8B7"
                                    />
                                )}
                            </Box>
                        </HStack>
                    </Pressable>

                    {/* Newest Option */}
                    <Pressable onPress={() => handleSortSelect('newest')}>
                        <HStack
                            alignItems="center"
                            justifyContent="space-between"
                            py={10}
                        >
                            <Text
                                color={isDark ? '#fff' : '#000'}
                                fontSize="$sm"
                                fontWeight="$normal"
                            >
                                {t('trustList.sortNewest')}
                            </Text>
                            <Box
                                width={20}
                                height={20}
                                borderRadius={10}
                                borderWidth={1}
                                borderColor="#B8B8B7"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {selectedSort === 'newest' && (
                                    <Box
                                        width={14}
                                        height={14}
                                        borderRadius={7}
                                        bg="#B8B8B7"
                                    />
                                )}
                            </Box>
                        </HStack>
                    </Pressable>

                    {/* Oldest Option */}
                    <Pressable onPress={() => handleSortSelect('oldest')}>
                        <HStack
                            alignItems="center"
                            justifyContent="space-between"
                            py={10}
                        >
                            <Text
                                color={isDark ? '#fff' : '#000'}
                                fontSize="$sm"
                                fontWeight="$normal"
                            >
                                {t('trustList.sortOldest')}
                            </Text>
                            <Box
                                width={20}
                                height={20}
                                borderRadius={10}
                                borderWidth={1}
                                borderColor="#B8B8B7"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {selectedSort === 'oldest' && (
                                    <Box
                                        width={14}
                                        height={14}
                                        borderRadius={7}
                                        bg="#B8B8B7"
                                    />
                                )}
                            </Box>
                        </HStack>
                    </Pressable>
                </VStack>
            </VStack>,
            {
                enablePanDownToClose: true,
                enableDynamicSizing: true,
                animateOnMount: true,
                paddingBottom: bottomInset,
                backgroundStyle: {
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                },
                handleStyle: {
                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                },
                handleIndicatorStyle: {
                    backgroundColor: isDark ? '#333333' : '#B8B8B7',
                    width: 40,
                    height: 4,
                },
            }
        );
    };

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <Box flex={1} bg={backgroundColor}>
                {/* Header */}
                <Header
                    title={userProfile?.name || t('trustList.loading')}
                    showBackButton
                    onBackPress={() => navigation.goBack()}
                />

                {/* Search Bar - Fixed at top */}
                <VStack
                    space="md"
                    pb="$4"
                    px="$4"
                    bg={backgroundColor}
                >
                    <HStack
                        alignItems="center"
                        bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                        borderWidth={1}
                        borderColor="#E9E9E9"
                        borderRadius={20}
                        px={14}
                        space="sm"
                    >
                        <MagnifyingGlassIcon
                            width={24}
                            height={24}
                            color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
                        />
                        <Input flex={1} borderWidth={0} bg="transparent">
                            <InputField
                                placeholder={activeTab === 'trust' ? t('trustList.searchTrust') : t('trustList.searchTruster')}
                                placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                                color={isDark ? '#000' : '#000'}
                                fontSize="$xs"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </Input>
                        {/* Filter Icon - Only for Truster tab */}
                        {activeTab === 'truster' && (
                            <Pressable p={8} onPress={handleFilterPress}>
                                <FunnelIcon
                                    width={18}
                                    height={18}
                                    color={isDark ? '#89898D' : '#89898D'}
                                />
                            </Pressable>
                        )}
                    </HStack>
                </VStack>

                {/* Tab Header */}
                <VStack pt={0} bg={tabHeaderBgColor}>
                    <HStack
                        ref={tabContainerRef}
                        borderBottomWidth={1}
                        borderColor="#E9E9E9"
                        p={0}
                        mb="$2"
                        position="relative"
                        onLayout={(event) => {
                            const width = event.nativeEvent.layout.width;
                            setTabContainerWidth(width);
                        }}
                    >
                        {/* Trust Tab */}
                        <Pressable
                            onPress={() => handleTabPress(0)}
                            flex={1}
                            alignItems="center"
                            pb={8}
                            px="$1"
                        >
                            <VStack alignItems="center" space="xs">
                                <Animated.Text
                                    style={[
                                        {
                                            fontSize: 12,
                                            fontWeight: 'bold',
                                        },
                                        trustTabStyle,
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {t('trustList.trust')}
                                </Animated.Text>
                            </VStack>
                        </Pressable>

                        {/* Truster Tab */}
                        <Pressable
                            onPress={() => handleTabPress(1)}
                            flex={1}
                            alignItems="center"
                            pb={8}
                            px="$1"
                        >
                            <VStack alignItems="center" space="xs">
                                <Animated.Text
                                    style={[
                                        {
                                            fontSize: 12,
                                            fontWeight: 'bold',
                                        },
                                        trusterTabStyle,
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {t('trustList.truster')}
                                </Animated.Text>
                            </VStack>
                        </Pressable>

                        {/* Animated Indicator */}
                        {tabWidth > 0 && (
                            <Animated.View
                                style={[
                                    {
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        width: indicatorWidth,
                                        height: 2,
                                        backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                    },
                                    indicatorStyle,
                                ]}
                            />
                        )}
                    </HStack>
                </VStack>

                {/* PagerView - Native swipe tab switching */}
                <AnimatedPagerView
                    ref={pagerRef}
                    style={{ flex: 1 }}
                    initialPage={initialPage}
                    onPageScroll={handlePageScroll}
                    onPageSelected={handlePageSelected}
                >
                    {/* Trust Tab Content */}
                    <Box key="0" flex={1}>
                        <ScrollView
                            flex={1}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: bottomInset }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefetchingTrustList}
                                    onRefresh={handleRefreshTrust}
                                    tintColor={isDark ? '#FFFFFF' : '#000000'}
                                    colors={isDark ? ['#FFFFFF'] : ['#000000']}
                                />
                            }
                        >
                            {/* Suggested Users Section */}
                            <SuggestionCard
                                title={t('trustList.viewSuggested')}
                                subtitle={t('trustList.viewSuggestedSubtitle')}
                                avatars={[
                                    {
                                        id: '1',
                                        source: DEFAULT_USER_AVATAR,
                                        alt: 'User 1'
                                    },
                                    {
                                        id: '2',
                                        source: DEFAULT_USER_AVATAR,
                                        alt: 'User 2'
                                    },
                                    {
                                        id: '3',
                                        source: DEFAULT_USER_AVATAR,
                                        alt: 'User 3'
                                    }
                                ]}
                                onPress={() => {
                                    navigation.navigate('SuggestedUsers' as any);
                                }}
                            />

                            {/* Trust Users List */}
                            {shouldShowTrustLoading ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#fff' : '#000'}>{t('trustList.loading')}</Text>
                                </Box>
                            ) : !userId ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('trustList.noUserId')}</Text>
                                </Box>
                            ) : trustListError ? (
                                <Box py={20} alignItems="center">
                                    <Text color="#CE4A4A">{t('trustList.error', { message: trustListError.message })}</Text>
                                </Box>
                            ) : showTrustEmptyState ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('trustList.noUserFound')}</Text>
                                </Box>
                            ) : filteredTrustUsers.length === 0 && !debouncedSearchQuery.trim() ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('trustList.trustListEmpty')}</Text>
                                </Box>
                            ) : (
                                filteredTrustUsers.map((user: TrustUserCardUser) => (
                                    <TrustUserCard
                                        key={user.id}
                                        user={user}
                                        showBorder={false}
                                        listType="trust"
                                        onUserPress={() => {
                                            profileNavigation.navigate('ProfileMain', { userId: user.id });
                                        }}
                                    />
                                ))
                            )}
                        </ScrollView>
                    </Box>

                    {/* Truster Tab Content */}
                    <Box key="1" flex={1}>
                        <ScrollView
                            flex={1}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: bottomInset }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isRefetchingTrusterList}
                                    onRefresh={handleRefreshTruster}
                                    tintColor={isDark ? '#FFFFFF' : '#000000'}
                                    colors={isDark ? ['#FFFFFF'] : ['#000000']}
                                />
                            }
                        >
                            {/* Suggested Users Section */}
                            <SuggestionCard
                                title={t('trustList.viewSuggested')}
                                subtitle={t('trustList.viewSuggestedSubtitle')}
                                avatars={[
                                    {
                                        id: '1',
                                        source: DEFAULT_USER_AVATAR,
                                        alt: 'User 1'
                                    },
                                    {
                                        id: '2',
                                        source: DEFAULT_USER_AVATAR,
                                        alt: 'User 2'
                                    },
                                    {
                                        id: '3',
                                        source: DEFAULT_USER_AVATAR,
                                        alt: 'User 3'
                                    }
                                ]}
                                onPress={() => {
                                    navigation.navigate('SuggestedUsers' as any);
                                }}
                            />

                            {/* Truster Users List */}
                            {shouldShowTrusterLoading ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#fff' : '#000'}>{t('trustList.loading')}</Text>
                                </Box>
                            ) : !userId ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('trustList.noUserId')}</Text>
                                </Box>
                            ) : trusterListError ? (
                                <Box py={20} alignItems="center">
                                    <Text color="#CE4A4A">{t('trustList.error', { message: trusterListError.message })}</Text>
                                </Box>
                            ) : showTrusterEmptyState ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('trustList.noUserFound')}</Text>
                                </Box>
                            ) : filteredTrusterUsers.length === 0 && !searchQuery.trim() ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('trustList.trusterListEmpty')}</Text>
                                </Box>
                            ) : (
                                filteredTrusterUsers.map((user: TrustUserCardUser) => (
                                    <TrustUserCard
                                        key={user.id}
                                        user={user}
                                        showBorder={false}
                                        listType="truster"
                                        onUserPress={() => {
                                            profileNavigation.navigate('ProfileMain', { userId: user.id });
                                        }}
                                    />
                                ))
                            )}
                        </ScrollView>
                    </Box>
                </AnimatedPagerView>

            </Box>
        </SafeAreaView>
    );
};

export default Trust_TrusterListScreen;