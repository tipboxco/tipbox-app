import React from 'react';
import { ScrollView, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { Box, Text, VStack, HStack, Avatar, Center, Input, InputField } from '@gluestack-ui/themed';
import { Header } from '../../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { mockTrusterList } from '@/src/mock/profile';
import { TrustUser } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - (3 * CARD_MARGIN) - 32) / 2; // 32 is total horizontal padding

const TrusterCard: React.FC<{ user: TrustUser }> = ({ user }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    if (!user) return null;

    return (
        <Box
            bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
            borderRadius="$lg"
            width={CARD_WIDTH}
            p="$2"
            mb="$4"
            mx="$1"
        >
            <Box>
                <VStack space="sm" alignItems="center">
                    <Box position="relative">
                        <Avatar size="xl">
                            <Avatar.Image source={{ uri: user.avatar }} alt={user.username} />
                            <Avatar.FallbackText>{user.username?.[0] || '?'}</Avatar.FallbackText>
                        </Avatar>
                        <Box
                            position="absolute"
                            bottom={-12}
                            alignSelf="center"
                            bg="#FFDB9C"
                            px="$2"
                            py="$1"
                            borderRadius="$lg"
                            flexDirection="row"
                            alignItems="center"
                        >
                            <Feather name="star" size={12} color="#000000" />
                            <Text
                                color="#000000"
                                fontSize="$xs"
                                fontWeight="$semibold"
                                ml="$1"
                            >
                                4.9
                            </Text>
                        </Box>
                    </Box>
                    <VStack space="xs" alignItems="center" mt="$4">
                        <Text
                            fontWeight="$bold"
                            size="sm"
                            color={isDark ? '$textDark50' : '$textLight900'}
                            numberOfLines={1}
                            textAlign="center"
                        >
                            {user.username}
                        </Text>
                        <Text
                            size="xs"
                            color={isDark ? '$textDark400' : '$textLight500'}
                            numberOfLines={1}
                            textAlign="center"
                        >
                            {user.mutualFriendsText}
                        </Text>
                    </VStack>
                    <Box
                        bg={user.badge?.color || '#FFD700'}
                        px="$2"
                        py="$1"
                        borderRadius="$lg"
                        width="100%"
                        alignItems="center"
                    >
                        <Text
                            color="#000000"
                            fontSize="$2xs"
                            fontWeight="$medium"
                        >
                            {user.badge?.name || 'Expert'}
                        </Text>
                    </Box>
                    <Pressable style={{ width: '100%', marginTop: 8 }}>
                        <Box
                            bg="#D8FF08"
                            px="$3"
                            py="$2"
                            borderRadius="$lg"
                            alignItems="center"
                            width="100%"
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
                </VStack>
            </Box>
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
                <VStack space="sm" p="$4">
                    <Box
                        bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                        borderRadius="$lg"
                        height={40}
                        mb="$4"
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
                    <Box flexDirection="row" flexWrap="wrap" justifyContent="flex-start">
                        {users.map((user) => (
                            <TrusterCard key={user.id} user={user} />
                        ))}
                    </Box>
                </VStack>
            </ScrollView>
        </Box>
    );
};