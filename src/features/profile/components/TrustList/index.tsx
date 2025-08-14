import React from 'react';
import { ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Box, Text, VStack, HStack, Avatar, Divider, Center, Input, InputField } from '@gluestack-ui/themed';
import { TrustUser } from '../../types';
import { mockTrustList } from '@/src/mock/profile';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

export const TrustListItem: React.FC<{ user: TrustUser }> = ({ user }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    if (!user) return null;

    return (
        <Box>
            <HStack space="md" py="$3" px="$4" alignItems="center">
                <Avatar size="md">
                    <Avatar.Image source={{ uri: user.avatar }} alt={user.username} />
                    <Avatar.FallbackText>{user.username?.[0] || '?'}</Avatar.FallbackText>
                </Avatar>
                <VStack flex={1} space="xs">
                    <HStack alignItems="center" space="sm">
                        <Text
                            fontWeight="$bold"
                            size="sm"
                            color={isDark ? '$textDark50' : '$textLight900'}
                        >
                            {user.username}
                        </Text>
                        <Box
                            bg={user.badge?.color || '#FFD700'}
                            px="$2"
                            py="$1"
                            borderRadius="$lg"
                        >
                            <Text
                                color="#000000"
                                fontSize="$2xs"
                                fontWeight="$medium"
                            >
                                {user.badge?.name || 'Expert'}
                            </Text>
                        </Box>
                    </HStack>
                    <Text
                        size="xs"
                        color={isDark ? '$textDark400' : '$textLight500'}
                    >
                        {user.mutualFriendsText}
                    </Text>
                </VStack>
            </HStack>
            <Divider
                bg={isDark ? '$backgroundDark100' : '$backgroundLight200'}
            />
        </Box>
    );
};

export const TrustList: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [isLoading, setIsLoading] = React.useState(true);
    const [users, setUsers] = React.useState<TrustUser[]>([]);
    const [searchText, setSearchText] = React.useState('');

    React.useEffect(() => {
        const loadData = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setUsers(mockTrustList);
            } catch (error) {
                console.error('Error loading trust list:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <Center flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Center>
        );
    }

    return (
        <ScrollView>
            <Box
                flex={1}
                bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
            >
                <VStack space="sm">
                    <Box
                        py="$4"
                        borderBottomWidth={1}
                        borderBottomColor={isDark ? '$backgroundDark100' : '$backgroundLight200'}
                    >
                        <HStack px="$4" space="sm" alignItems="center">
                            <Box
                                flex={1}
                                bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                                borderRadius="$lg"
                                height={40}
                            >
                                <Input variant="outline" size="md" borderWidth={0}>
                                    <Box pl="$3">
                                        <Feather
                                            name="search"
                                            size={24}
                                            color={isDark ? '#666666' : '#999999'}
                                        />
                                    </Box>
                                    <InputField
                                        value={searchText}
                                        onChangeText={setSearchText}
                                        placeholder="Search"
                                        placeholderTextColor={isDark ? '$textDark400' : '$textLight500'}
                                        color={isDark ? '$textDark50' : '$textLight900'}
                                    />
                                </Input>
                            </Box>
                            <HStack space="sm">
                                <Pressable>
                                    <Box
                                        borderWidth={1}
                                        borderColor={isDark ? '$backgroundDark100' : '$backgroundLight200'}
                                        borderRadius="$md"
                                        p="$2"
                                    >
                                        <Feather
                                            name="arrow-up"
                                            size={24}
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        />
                                    </Box>
                                </Pressable>
                                <Pressable>
                                    <Box
                                        borderWidth={1}
                                        borderColor={isDark ? '$backgroundDark100' : '$backgroundLight200'}
                                        borderRadius="$md"
                                        p="$2"
                                    >
                                        <Feather
                                            name="filter"
                                            size={24}
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                        />
                                    </Box>
                                </Pressable>
                            </HStack>
                        </HStack>
                    </Box>
                    <VStack>
                        {users.map((user) => (
                            <TrustListItem key={user.id} user={user} />
                        ))}
                    </VStack>
                </VStack>
            </Box>
        </ScrollView>
    );
};