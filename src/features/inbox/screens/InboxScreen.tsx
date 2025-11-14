import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/src/components/Header';
import { mock_user_profile } from '@/src/mock/common';
import MessagesScreen from './MessagesScreen';
import SupportRequestsScreen from './SupportRequestsScreen';

type InboxScreenNavigationProp = NativeStackNavigationProp<any, 'InboxScreen'>;

const InboxScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeTab, setActiveTab] = useState<'messages' | 'support'>('messages');
  const navigation = useNavigation<InboxScreenNavigationProp>();

  const handleTabPress = (tab: 'messages' | 'support') => {
    setActiveTab(tab);
  };


  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Inbox"
        leftAction="menu"
      />

      <VStack flex={1} py="$2" space="md">
        {/* Tabs */}
        <VStack px="$4" bg={isDark ? '#000' : '#FFF'}>
          <HStack space="lg">
            <Pressable
              onPress={() => handleTabPress('messages')}
              flex={1}
              alignItems="center"
              py="$2"
            >
              <Text
                color={activeTab === 'messages' ? '#000' : '#8C8C8C'}
                fontSize={12}
                fontWeight="$bold"
              >
                Messages
              </Text>
              {activeTab === 'messages' && (
                <Box
                  width={112}
                  height={2}
                  bg="#000"
                  mt="$1"
                  borderRadius={1}
                />
              )}
            </Pressable>
            <Pressable
              onPress={() => handleTabPress('support')}
              flex={1}
              alignItems="center"
              py="$2"
            >
              <Text
                color={activeTab === 'support' ? '#000' : '#8C8C8C'}
                fontSize={12}
                fontWeight="$bold"
              >
                1-on-1 Support Requests
              </Text>
              {activeTab === 'support' && (
                <Box
                  width={112}
                  height={2}
                  bg="#000"
                  mt="$1"
                  borderRadius={1}
                />
              )}
            </Pressable>
          </HStack>
        </VStack>

        {/* Content based on active tab */}
        {activeTab === 'messages' && <MessagesScreen />}
        {activeTab === 'support' && <SupportRequestsScreen />}
      </VStack>
    </Box>
  );
};

InboxScreen.displayName = 'InboxScreen';

export default InboxScreen;
