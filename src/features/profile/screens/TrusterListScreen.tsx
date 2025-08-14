import React from 'react';
import { ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Box, Text, VStack, HStack, Avatar, Divider, Center, Input, InputField } from '@gluestack-ui/themed';
import { Header } from '../../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { mockTrusterList } from '@/src/mock/profile';
import { TrustUser } from '../types';

const TrusterListItem: React.FC<{ user: TrustUser }> = ({ user }) => {
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
                <Pressable>
                    <Box
                        bg="#D8FF08"
                        px="$3"
                        py="$2"
                        borderRadius="$lg"
                    >
                        <Text
                            color="#181C00"
                            fontSize="$xs"
                            fontWeight="$semibold"
                        >
                            Add Trust
                        </Text>
                    </Box>
                </Pressable>
            </HStack>
            <Divider
                bg={isDark ? '$backgroundDark100' : '$backgroundLight200'}
            />
        </Box>
    );
};

export const TrusterListScreen = () => {
    const navigation = useNavigation();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [isLoading, setIsLoading] = React.useState(true);
    const [users, setUsers] = React.useState<TrustUser[]>([]);
    const [searchText, setSearchText] = React.useState('');

    React.useEffect(() => {
        const loadData = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                setUsers(mockTrusterList);
            } catch (error) {
                console.error('Error loading truster list:', error);
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
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            <Header
                title="Truster List"
                showBackButton
                onMenuPress={() => navigation.goBack()}
            />
            <ScrollView>
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
                                <Input 
                                    variant="outline" 
                                    size="md" 
                                    borderWidth={0}
                                    height={40}
                                >
                                    <Box pl="$3" alignSelf="center">
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
                                        height={40}
                                        width={40}
                                        alignItems="center"
                                        justifyContent="center"
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
                                        height={40}
                                        width={40}
                                        alignItems="center"
                                        justifyContent="center"
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
                            <TrusterListItem key={user.id} user={user} />
                        ))}
                    </VStack>
                </VStack>
            </ScrollView>
        </Box>
    );
};