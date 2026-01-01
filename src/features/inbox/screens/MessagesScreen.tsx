import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Input,
    InputField,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import MessageCard from '../components/MessageCard/index';
import MessagesFilterGroup from '../components/MessagesFilterGroup/index';
import type { InboxStackParamList } from '../navigation';
import { useSafeAreaValues } from '@/src/utils';
import { useMessages, inboxKeys } from '../api/hooks';
import type { InboxMessage } from '../types';
import { useSocket } from '@/src/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';

type MessagesScreenNavigationProp = NativeStackNavigationProp<InboxStackParamList>;

const MessagesScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [activeCategory, setActiveCategory] = useState<string>('1');
    const [searchQuery, setSearchQuery] = useState('');
    const navigation = useNavigation<MessagesScreenNavigationProp>();
    const bottomInset = useSafeAreaValues('bottom');

    const { data: messages, isLoading, error, refetch, isRefetching } = useMessages();
    const queryClient = useQueryClient();
    const { isConnected, on, off } = useSocket();

    // Socket event handler - new_message event
    const handleNewMessage = useCallback((eventData: any) => {
        console.log('[MessagesScreen] New message received:', eventData);
        // Invalidate messages query to refresh the list
        queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    }, [queryClient]);

    // Socket event listeners
    useEffect(() => {
        if (!isConnected) return;

        on('new_message', handleNewMessage);

        return () => {
            off('new_message', handleNewMessage);
        };
    }, [isConnected, on, off, handleNewMessage]);

    const handleMessagePress = (messageId: string) => {
        const message = (messages || []).find(m => m.id === messageId);
        if (message) {
            navigation.navigate('MessageDetailScreen', {
                messageId: message.id,
                senderName: message.senderName,
                senderTitle: message.senderTitle || '',
                senderAvatar: message.senderAvatar,
            });
        }
    };

    const handleCategoryPress = (categoryId: string) => {
        setActiveCategory(categoryId);
    };

    const getFilteredMessages = () => {
        let filtered: InboxMessage[] = messages || [];

        if (searchQuery) {
            filtered = filtered.filter(message =>
                message.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    return (
        <VStack flex={1} space="md">
            {/* Search + Filters */}
            <VStack px="$4" space="md">
                {/* Search Bar */}
                <HStack
                    alignItems="center"
                    bg={isDark ? '#1A1A1A' : '#F2F2F2'}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    borderRadius={20}
                    px={14}
                    space="sm"
                >
                    <Feather
                        name="search"
                        size={24}
                        color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
                    />
                    <Input flex={1} borderWidth={0} bg="transparent">
                        <InputField
                            placeholder="Mesajlarda Ara"
                            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
                            color={isDark ? '#000' : '#000'}
                            fontSize={9}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </Input>
                </HStack>

                {/* Filter Buttons - TODO: API'ye taşındığında categories de buradan gelecek */}
                <MessagesFilterGroup
                    categories={[]}
                    activeCategory={activeCategory}
                    onCategoryPress={handleCategoryPress}
                />
            </VStack>

            {/* Messages List - Full Height */}
            {isLoading ? (
                <Box py={20} alignItems="center">
                    <Text color={isDark ? '#fff' : '#000'}>Yükleniyor...</Text>
                </Box>
            ) : error ? (
                <Box py={20} alignItems="center">
                    <Text color="#CE4A4A">Hata: {error.message}</Text>
                </Box>
            ) : (
                <FlatList
                    data={getFilteredMessages()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <MessageCard
                            data={item}
                            onPress={handleMessagePress}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetch()}
                            tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
                        />
                    }
                />
            )}
        </VStack>
    );
};

MessagesScreen.displayName = 'MessagesScreen';

export default MessagesScreen;
