import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    VStack, 
    HStack, 
    Text, 
    Pressable, 
    Box, 
    Image,
    ScrollView
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/navigation.types';
import { Header } from '@/src/components/Header';
import { SuggestedUserCard } from '../components/SuggestedUserCard';
import { useSuggestedUsers, useAddToTrustList } from '../api/hooks';
import { toImageSource } from '@/src/utils';
import { ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '../api/hooks';

type SuggestedUsersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SuggestedUsersScreen = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<SuggestedUsersScreenNavigationProp>();
    const queryClient = useQueryClient();
    
    const [addedUsers, setAddedUsers] = useState<string[]>([]);
    
    // API hooks
    const { data: suggestedUsers, isLoading, error } = useSuggestedUsers();
    const addToTrustMutation = useAddToTrustList();

    const handleAddTrust = (userId: string) => {
        if (addedUsers.includes(userId)) {
            return; // Zaten eklenmiş
        }
        
        setAddedUsers(prev => [...prev, userId]);
        
        // API'ye trust ekle
        addToTrustMutation.mutate(userId, {
            onSuccess: () => {
                console.log('[SuggestedUsersScreen] ✅ User added to trust list');
                // Trust listesini invalidate et
                queryClient.invalidateQueries({ queryKey: profileKeys.trusts() });
                // Suggested users listesini invalidate et (kullanıcı listeden çıkarılabilir)
                queryClient.invalidateQueries({ queryKey: profileKeys.suggestedUsers() });
            },
            onError: (error) => {
                console.error('[SuggestedUsersScreen] ❌ Add trust error:', error);
                // Hata durumunda addedUsers'dan çıkar
                setAddedUsers(prev => prev.filter(id => id !== userId));
            },
        });
    };

    // API'den gelen veriyi SuggestedUserCard formatına map et
    const mapSuggestedUserToCardData = (user: any) => {
        // Kullanıcının kendi avatar'ı
        const userAvatar = user.avatar ? toImageSource(user.avatar) : require('@/assets/avatar/default-useravatar.png');
        
        // Mutual trust avatars (eğer varsa)
        const mutualAvatars = user.mutualTrustAvatars || [];
        const mappedAvatars = [
            {
                id: user.id,
                source: userAvatar,
                alt: user.name,
            },
            ...mutualAvatars.slice(0, 2).map((mutual: any, index: number) => ({
                id: mutual.id || `mutual-${index}`,
                source: mutual.avatar ? toImageSource(mutual.avatar) : require('@/assets/avatar/default-useravatar.png'),
                alt: `Mutual trust ${index + 1}`,
            })),
        ];

        return {
            id: user.id,
            name: user.name,
            title: user.title || '',
            avatars: mappedAvatars,
        };
    };

    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '#000' : '#FFFFFF'}>
            {/* Header */}
            <Header
                title="Suggested Users"
                showBackButton
                onBackPress={() => navigation.goBack()}
            />

            {/* Content */}
            {isLoading ? (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
            ) : error ? (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color="#CE4A4A" fontSize="$sm">
                        {error.message || 'Failed to load suggested users'}
                    </Text>
                </Box>
            ) : suggestedUsers && suggestedUsers.length > 0 ? (
                <ScrollView flex={1} keyboardShouldPersistTaps="handled">
                    {suggestedUsers.map((user) => {
                        const cardData = mapSuggestedUserToCardData(user);
                        return (
                            <SuggestedUserCard
                                key={user.id}
                                id={cardData.id}
                                name={cardData.name}
                                title={cardData.title}
                                avatars={cardData.avatars}
                                onAddTrust={handleAddTrust}
                                showBorder={false}
                            />
                        );
                    })}
                </ScrollView>
            ) : (
                <Box flex={1} justifyContent="center" alignItems="center" px="$4">
                    <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} fontSize="$sm">
                        No suggested users found
                    </Text>
                </Box>
            )}
        </VStack>
        </SafeAreaView>
    );
};

export default SuggestedUsersScreen;
