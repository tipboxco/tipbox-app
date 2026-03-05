import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Pressable,
    ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useTranslation } from 'react-i18next';

export interface LikedUser {
    id: string;
    username: string;
    avatar?: string | null;
}

export interface LikedUsersBottomSheetProps {
    primaryUser?: {
        id?: string;
        username?: string;
        avatar?: string | null;
    };
    otherUsers?: Array<{
        id?: string;
        username?: string;
        avatar?: string | null;
    }>;
    onClose?: () => void;
}

/**
 * Liked Users Bottom Sheet
 * Instagram benzeri: Beğenen kullanıcıları gösterir
 */
export const LikedUsersBottomSheet: React.FC<LikedUsersBottomSheetProps> = ({
    primaryUser,
    otherUsers = [],
    onClose,
}) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const { t } = useTranslation('notifications');

    // Tüm kullanıcıları birleştir: primaryUser + otherUsers
    const allUsers: LikedUser[] = React.useMemo(() => {
        const users: LikedUser[] = [];
        
        // Primary user'ı ekle (eğer varsa)
        if (primaryUser?.id && primaryUser?.username) {
            users.push({
                id: primaryUser.id,
                username: primaryUser.username,
                avatar: primaryUser.avatar,
            });
        }
        
        // Other users'ı ekle
        otherUsers.forEach((user) => {
            if (user.id && user.username) {
                // Primary user ile aynı değilse ekle (duplicate kontrolü)
                if (user.id !== primaryUser?.id) {
                    users.push({
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar,
                    });
                }
            }
        });
        
        return users;
    }, [primaryUser, otherUsers]);

    // Kullanıcıya tıklandığında profile'a yönlendir
    const handleUserPress = React.useCallback((userId: string) => {
        if (!userId) {
            return;
        }
        
        const userIdString = String(userId).trim();
        
        if (!userIdString || userIdString.length === 0) {
            return;
        }
        
        try {
            navigationService.navigate(ROOT_ROUTES.PROFILE, {
                screen: 'ProfileMain',
                params: { userId: userIdString },
            }, {
                priority: 'high',
                force: false,
            });
            
            // Bottom sheet'i kapat
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('[LikedUsersBottomSheet] Navigation error:', error);
        }
    }, [onClose]);

    return (
        <VStack flex={1} bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
            {/* Header */}
            <Box
                px="$4"
                py="$3"
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
            >
                <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$lg"
                    fontWeight="$bold"
                    textAlign="center"
                >
                    {t('likedUsers.title')}
                </Text>
            </Box>

            {/* Users List */}
            <ScrollView
                flex={1}
                showsVerticalScrollIndicator={false}
            >
                <VStack space={0}>
                    {allUsers.length === 0 ? (
                        <Box py="$8" alignItems="center">
                            <Text
                                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                fontSize="$sm"
                            >
                                {t('likedUsers.emptyState')}
                            </Text>
                        </Box>
                    ) : (
                        allUsers.map((user, index) => {
                            const avatarSource = user.avatar
                                ? toImageSource(user.avatar)
                                : DEFAULT_USER_AVATAR;
                            
                            return (
                                <Pressable
                                    key={user.id || `user-${index}`}
                                    onPress={() => handleUserPress(user.id)}
                                >
                                    <HStack
                                        alignItems="center"
                                        px="$4"
                                        py="$3"
                                        space="md"
                                        borderBottomWidth={index < allUsers.length - 1 ? 1 : 0}
                                        borderBottomColor={isDark ? '#333' : '#E9E9E9'}
                                    >
                                        {/* Avatar */}
                                        <Box
                                            width={48}
                                            height={48}
                                            borderRadius={24}
                                            borderWidth={1}
                                            borderColor={isDark ? '#333' : '#E9E9E9'}
                                            overflow="hidden"
                                        >
                                            <Image
                                                source={avatarSource}
                                                alt={user.username}
                                                width={48}
                                                height={48}
                                            />
                                        </Box>

                                        {/* Username */}
                                        <VStack flex={1}>
                                            <Text
                                                color={isDark ? '#FFFFFF' : '#000000'}
                                                fontSize="$sm"
                                                fontWeight="$semibold"
                                            >
                                                {user.username}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </Pressable>
                            );
                        })
                    )}
                </VStack>
            </ScrollView>
        </VStack>
    );
};

export default LikedUsersBottomSheet;
