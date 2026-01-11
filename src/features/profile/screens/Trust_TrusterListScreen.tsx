import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const route = useRoute<TrustListScreenRouteProp>();
    const navigation = useNavigation<TrustListScreenNavigationProp>();
    const profileNavigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const bottomInset = useSafeAreaValues('bottom');

    const userId = route.params?.userId;
    const [activeTab, setActiveTab] = useState<'trust' | 'truster'>(
        route.params?.initialTab || 'trust'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
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

    // React Query hook - sadece trust sekmesinde aktif, search query ile
    const { data: trustListData, isLoading: isTrustListLoading, error: trustListError } = useTrustList(
        activeTab === 'trust' ? userId : undefined,
        activeTab === 'trust' ? (debouncedSearchQuery.trim() || undefined) : undefined
    );

    // React Query hook - sadece truster sekmesinde aktif, search query ile
    const { data: trusterListData, isLoading: isTrusterListLoading, error: trusterListError } = useTrusterList(
        activeTab === 'truster' ? userId : undefined,
        activeTab === 'truster' ? (debouncedSearchQuery.trim() || undefined) : undefined
    );

    // API'den gelen data'yı mock formatına transform et (sadece TrustUserCard için gerekli)
    const transformTrustApiUserToCardUser = (apiUser: ApiTrustUser): TrustUserCardUser => {
        return {
            id: apiUser.id,
            name: apiUser.name,
            title: apiUser.titles?.[0] || '', // İlk title'ı kullan
            avatar: apiUser.avatar ? { uri: apiUser.avatar } : undefined, // String URL'yi Image source formatına çevir
            trustLevel: 3, // Varsayılan trust level (API'de yok)
            isOnline: false, // Varsayılan
        };
    };

    const transformTrusterApiUserToCardUser = (apiUser: ApiTrusterUser): TrustUserCardUser => {
        return {
            id: apiUser.id,
            name: apiUser.name,
            title: apiUser.titles?.[0] || '',
            avatar: apiUser.avatar ? { uri: apiUser.avatar } : undefined,
            trustLevel: 3,
            isOnline: false,
        };
    };

    // Trust sekmesi için sadece API'den gelen verileri kullan (backend'de filtrelenmiş)
    const trustUsers: TrustUserCardUser[] = activeTab === 'trust'
        ? (trustListData?.map(transformTrustApiUserToCardUser) || [])
        : [];

    // Truster sekmesi için API verisi
    const trusterUsers: TrustUserCardUser[] = activeTab === 'truster'
        ? (trusterListData?.map(transformTrusterApiUserToCardUser) || [])
        : [];

    // Get current data based on active tab
    const currentUsers = activeTab === 'trust' ? trustUsers : trusterUsers;

    // Filter users based on search query - sadece Truster sekmesi için frontend filtreleme
    // Trust sekmesinde backend'den filtrelenmiş veri geliyor, bu yüzden direkt kullan
    const filteredUsers = activeTab === 'trust'
        ? currentUsers // Trust sekmesinde backend'den filtrelenmiş veri geliyor
        : currentUsers.filter((user: TrustUserCardUser) => {
            // Truster sekmesinde mock data'yı frontend'de filtrele
            return user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.title.toLowerCase().includes(searchQuery.toLowerCase());
        });

    // Trust sekmesinde search query varsa ve data boşsa, "Kullanıcı bulunamadı" göster
    const showEmptyState = activeTab === 'trust'
        ? (!isTrustListLoading && !trustListError && debouncedSearchQuery.trim().length > 0 && filteredUsers.length === 0)
        : (!isTrusterListLoading && !trusterListError && searchQuery.trim().length > 0 && filteredUsers.length === 0);

    const handlePopoverOpen = (userId: string) => {
        setOpenPopoverId(userId);
    };

    const handlePopoverClose = () => {
        setOpenPopoverId(null);
    };

    const handleSortSelect = (sort: 'default' | 'newest' | 'oldest') => {
        setSelectedSort(sort);
        closeBottomSheet();
    };

    const handleFilterPress = () => {
        openBottomSheet(
            <VStack flex={1} px={16} py={20}>
                {/* Sort Header */}
                <HStack justifyContent="center" mb={20}>
                    <Text
                        color={isDark ? '#fff' : '#000'}
                        fontSize={16}
                        fontWeight="$bold"
                    >
                        Sort
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
                                fontSize={14}
                                fontWeight="$normal"
                            >
                                Default
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
                                fontSize={14}
                                fontWeight="$normal"
                            >
                                Sort by: Newest
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
                                fontSize={14}
                                fontWeight="$normal"
                            >
                                Sort by: Oldest
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
                    backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                },
                handleStyle: {
                    backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA',
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
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <VStack flex={1} bg={isDark ? '#000' : '#FAFAFA'}>
                {/* Header */}
                <Header
                    title={userProfile?.name || 'Loading...'}
                    showBackButton
                    onBackPress={() => navigation.goBack()}
                />

                {/* Tab Bar */}
                <VStack py={16} bg={isDark ? '#000' : '#FAFAFA'}>
                    <HStack borderBottomWidth={1} borderColor="#E9E9E9" p={0} m={0} mb={16}>
                        <Pressable
                            onPress={() => setActiveTab('trust')}
                            flex={1}
                            alignItems="center"
                            pb="$1"
                            position="relative"
                        >
                            <VStack alignItems="center" space="xs">
                                <Text
                                    color={activeTab === 'trust' ? '#000' : '#8C8C8C'}
                                    fontSize={12}
                                    fontWeight="$bold"
                                >
                                    Trust
                                </Text>
                            </VStack>
                            <Box
                                position="absolute"
                                bottom={-1}
                                left="25%"
                                height={2}
                                width="50%"
                                borderRadius={999}
                                bg={activeTab === 'trust' ? '#000' : 'transparent'}
                            />
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('truster')}
                            flex={1}
                            alignItems="center"
                            pb="$1"
                            position="relative"
                        >
                            <VStack alignItems="center" space="xs">
                                <Text
                                    color={activeTab === 'truster' ? '#000' : '#8C8C8C'}
                                    fontSize={12}
                                    fontWeight="$bold"
                                >
                                    Truster
                                </Text>
                            </VStack>
                            <Box
                                position="absolute"
                                bottom={-1}
                                left="25%"
                                height={2}
                                width="50%"
                                borderRadius={999}
                                bg={activeTab === 'truster' ? '#000' : 'transparent'}
                            />
                        </Pressable>
                    </HStack>

                    <VStack px="$4">
                        {/* Search Bar */}
                        <HStack
                            alignItems="center"
                            bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            borderRadius={23}
                            px={12}
                            space="sm"
                        >
                            <Feather
                                name="search"
                                size={24}
                                color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
                            />
                            <Input flex={1} borderWidth={0} bg="transparent">
                                <InputField
                                    placeholder={activeTab === 'trust' ? "Search for a user in the Trust List." : "Search for a user in the Truster List."}
                                    placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                                    color={isDark ? '#fff' : '#000'}
                                    fontSize={11}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </Input>
                            {/* Filter Icon - Only for Truster tab */}
                            {activeTab === 'truster' && (
                                <Pressable p={8}                                 onPress={handleFilterPress}>
                                    <Feather
                                        name="filter"
                                        size={18}
                                        color={isDark ? '#89898D' : '#89898D'}
                                    />
                                </Pressable>
                            )}
                        </HStack>
                    </VStack>
                </VStack>

                {/* Content */}
                <VStack flex={1}>
                    {activeTab === 'trust' ? (
                        <ScrollView
                            flex={1}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: bottomInset }}
                        >
                            {/* Suggested Users Section */}
                            <SuggestionCard
                                title="View Suggested Users"
                                subtitle="Based on the categories you are interested in."
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
                            {isTrustListLoading ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#fff' : '#000'}>Yükleniyor...</Text>
                                </Box>
                            ) : trustListError ? (
                                <Box py={20} alignItems="center">
                                    <Text color="#CE4A4A">Hata: {trustListError.message}</Text>
                                </Box>
                            ) : showEmptyState ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>Kullanıcı bulunamadı</Text>
                                </Box>
                            ) : filteredUsers.length === 0 && !debouncedSearchQuery.trim() ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>Henüz trust listeniz boş</Text>
                                </Box>
                            ) : (
                                filteredUsers.map((user: TrustUserCardUser) => (
                                    <TrustUserCard
                                        key={user.id}
                                        user={user}
                                        showBorder={false}
                                        isPopoverOpen={openPopoverId === user.id}
                                        onPopoverOpen={() => handlePopoverOpen(user.id)}
                                        onPopoverClose={handlePopoverClose}
                                        onUserPress={() => {
                                            profileNavigation.navigate('ProfileMain', { userId: user.id });
                                        }}
                                    />
                                ))
                            )}
                        </ScrollView>
                    ) : (
                        <ScrollView
                            flex={1}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: bottomInset }}
                        >
                            {/* Suggested Users Section */}
                            <SuggestionCard
                                title="View Suggested Users"
                                subtitle="Based on the categories you are interested in."
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
                            {isTrusterListLoading ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#fff' : '#000'}>Yükleniyor...</Text>
                                </Box>
                            ) : trusterListError ? (
                                <Box py={20} alignItems="center">
                                    <Text color="#CE4A4A">Hata: {trusterListError.message}</Text>
                                </Box>
                            ) : filteredUsers.length === 0 && !searchQuery.trim() ? (
                                <Box py={20} alignItems="center">
                                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>Henüz truster listeniz boş</Text>
                                </Box>
                            ) : (
                            filteredUsers.map((user: TrustUserCardUser) => (
                                <TrustUserCard
                                    key={user.id}
                                    user={user}
                                    showBorder={false}
                                    isPopoverOpen={openPopoverId === user.id}
                                    onPopoverOpen={() => handlePopoverOpen(user.id)}
                                    onPopoverClose={handlePopoverClose}
                                    onUserPress={() => {
                                        profileNavigation.navigate('ProfileMain', { userId: user.id });
                                    }}
                                />
                            )))}
                        </ScrollView>
                    )}
                </VStack>

                {/* Güvenli kapanış overlay'i - sadece popover açıkken aktif */}
                {openPopoverId && (
                    <Pressable
                        onPress={handlePopoverClose}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            zIndex: 1
                        }}
                        pointerEvents="auto"
                    />
                )}

            </VStack>
        </SafeAreaView>
    );
};

export default Trust_TrusterListScreen;