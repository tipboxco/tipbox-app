import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    VStack,
    HStack,
    Text,
    Pressable,
    Box,
    Image,
    ScrollView,
    Spinner
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/src/components/Header';
import { SuggestedUserCard } from '../components/SuggestedUserCard';
import { useSuggestedUsers, useAddToTrustList } from '../api/hooks';
import { FlatList } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/src/hooks/useTranslation';
import { ProfileStackParamList } from '../navigation';

type SuggestedUsersScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const SuggestedUsersScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<SuggestedUsersScreenNavigationProp>();
    const queryClient = useQueryClient();
    const { t } = useTranslation('profile');
    
    // Local state for optimistic updates
    const [localTrustedUsers, setLocalTrustedUsers] = useState<Set<string>>(new Set());
    
    // React Query hooks
    const { 
        data, 
        isLoading, 
        error, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage 
    } = useSuggestedUsers();
    
    const addTrustMutation = useAddToTrustList();

    // Combine all pages into a single array and filter duplicates
    const allUsers = React.useMemo(() => {
        if (!data?.pages) return [];
        
        const flatUsers = data.pages.flatMap(page => page.items);
        
        // Filter duplicate users (users with the same ID)
        const uniqueUsers = flatUsers.reduce((acc, user) => {
            if (!acc.find(u => u.id === user.id)) {
                acc.push(user);
            }
            return acc;
        }, [] as typeof flatUsers);
        
        return uniqueUsers;
    }, [data?.pages]);

    const handleAddTrust = (userId: string) => {
        console.log('Add trust clicked for user:', userId);

        // Optimistic update: Show immediately in UI
        setLocalTrustedUsers(prev => new Set(prev).add(userId));

        addTrustMutation.mutate(userId, {
            onSuccess: () => {
                console.log('✅ Trust added successfully');
                // Refresh suggested users list
                queryClient.invalidateQueries({ queryKey: ['profile', 'suggested'] });
            },
            onError: (error) => {
                console.error('❌ Failed to add trust:', error);
                // Revert optimistic update on error
                setLocalTrustedUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            },
        });
    };

    // ADDED: Navigate to user profile
    const handleUserPress = (userId: string) => {
        console.log('Navigate to user profile:', userId);
        navigation.navigate('ProfileMain', { userId });
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <Box py={16} alignItems="center">
                <Spinner size="small" color={isDark ? '#FFF' : '#000'} />
            </Box>
        );
    };

    const renderEmptyComponent = () => {
        if (isLoading) {
            return (
                <Box flex={1} alignItems="center" justifyContent="center" py={40}>
                    <Spinner size="large" color={isDark ? '#FFF' : '#000'} />
                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} mt={16}>
                        {t('suggestedUsers.loading')}
                    </Text>
                </Box>
            );
        }

        if (error) {
            return (
                <Box flex={1} alignItems="center" justifyContent="center" py={40}>
                    <Text color="#FF0000" fontSize={14}>
                        {t('suggestedUsers.error')}
                    </Text>
                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} mt={8} fontSize={12}>
                        {error.message}
                    </Text>
                </Box>
            );
        }

        return (
            <Box flex={1} alignItems="center" justifyContent="center" py={40}>
                <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} fontSize={14}>
                    {t('suggestedUsers.noUsers')}
                </Text>
            </Box>
        );
    };

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '#000' : '#FFFFFF'}>
            {/* Header */}
            <Header
                title={t('suggestedUsers.title')}
                showBackButton
                onBackPress={() => navigation.goBack()}
            />

            {/* Content */}
            <FlatList
                data={allUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <SuggestedUserCard
                        id={item.id}
                        name={item.name}
                        titles={item.titles}
                        avatar={item.avatar}
                        mutualTrustCount={item.mutualTrustCount}
                        isTrusted={item.isTrusted || localTrustedUsers.has(item.id)}
                        onAddTrust={handleAddTrust}
                        onPress={handleUserPress}
                        showBorder={false}
                    />
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmptyComponent}
                contentContainerStyle={allUsers.length === 0 ? { flex: 1 } : undefined}
            />
        </VStack>
        </SafeAreaView>
    );
};

export default SuggestedUsersScreen;
