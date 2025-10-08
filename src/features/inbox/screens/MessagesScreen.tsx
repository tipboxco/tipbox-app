import React, { useState } from 'react';
import { FlatList } from 'react-native';
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
import { inboxData } from '@/src/mock/inbox/messages';
import { Feather } from '@expo/vector-icons';
import { Message, MessageCategory } from '@/src/mock/inbox/messages/types';
import MessageCard from '../components/MessageCard/index';
import MessagesFilterGroup from '../components/MessagesFilterGroup/index';

type MessagesScreenNavigationProp = NativeStackNavigationProp<any, 'MessagesScreen'>;

const MessagesScreen: React.FC = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [activeCategory, setActiveCategory] = useState<string>('1');
    const [searchQuery, setSearchQuery] = useState('');
    const navigation = useNavigation<MessagesScreenNavigationProp>();

    const handleMessagePress = (messageId: string) => {
        // Navigate to message detail
        console.log('Message pressed:', messageId);
    };

    const handleCategoryPress = (categoryId: string) => {
        setActiveCategory(categoryId);
    };

    const getFilteredMessages = () => {
        let filtered = inboxData.messages;

        if (searchQuery) {
            filtered = filtered.filter(message =>
                message.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                message.senderTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    return (
        <>
            <VStack space="md" px="$4">
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

                {/* Filter Buttons */}
                <MessagesFilterGroup
                    categories={inboxData.categories}
                    activeCategory={activeCategory}
                    onCategoryPress={handleCategoryPress}
                />
            </VStack>

            {/* Messages List - Full Width */}
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
                style={{ flex: 1 }}
            />
        </>
    );
};

MessagesScreen.displayName = 'MessagesScreen';

export default MessagesScreen;
