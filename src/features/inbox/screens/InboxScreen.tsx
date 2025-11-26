import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Inbox"
        leftAction="menu"
      />

      <VStack flex={1} py="$2" space="md">
        {/* Tabs - Collections / Trust_Truster tarzı */}
        <VStack pt='$4' bg={isDark ? '#000' : '#FAFAFA'}>
          <HStack borderBottomWidth={1} borderColor="#E9E9E9" p={0} m={0}>
            <Pressable
              onPress={() => handleTabPress('messages')}
              flex={1}
              alignItems="center"
              pb="$1"
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Text
                  color={activeTab === 'messages' ? '#000' : '#8C8C8C'}
                  fontSize={12}
                  fontWeight="$bold"
                >
                  Messages
                </Text>
              </VStack>
              <Box
                position="absolute"
                bottom={-1}
                left="25%"
                height={2}
                width="50%"
                borderRadius={999}
                bg={activeTab === 'messages' ? '#000' : 'transparent'}
              />
            </Pressable>

            <Pressable
              onPress={() => handleTabPress('support')}
              flex={1}
              alignItems="center"
              pb="$1"
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Text
                  color={activeTab === 'support' ? '#000' : '#8C8C8C'}
                  fontSize={12}
                  fontWeight="$bold"
                >
                  1-on-1 Support Requests
                </Text>
              </VStack>
              <Box
                position="absolute"
                bottom={-1}
                left="25%"
                height={2}
                width="50%"
                borderRadius={999}
                bg={activeTab === 'support' ? '#000' : 'transparent'}
              />
            </Pressable>
          </HStack>
        </VStack>

        {/* Content based on active tab */}
        {activeTab === 'messages' && <MessagesScreen />}
        {activeTab === 'support' && <SupportRequestsScreen />}
      </VStack>
    </Box>
    </SafeAreaView>
  );
};

InboxScreen.displayName = 'InboxScreen';

export default InboxScreen;
