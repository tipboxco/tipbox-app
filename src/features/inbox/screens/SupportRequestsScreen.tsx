import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { supportRequestData } from '@/src/mock/inbox/SupportRequests';
import { Feather } from '@expo/vector-icons';
import SupportRequestCard from '../components/SupportRequestCard/index';
import SupportRequestFilterGroup from '../components/SupportRequestFilterGroup/index';

type SupportRequestsScreenNavigationProp = NativeStackNavigationProp<any, 'SupportRequestsScreen'>;

const SupportRequestsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeFilter, setActiveFilter] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<SupportRequestsScreenNavigationProp>();

  const handleRequestPress = (requestId: string) => {
    // Find the request data
    const request = supportRequestData.requests.find(r => r.id === requestId);
    
    if (request) {
      // Navigate to SupportMessageDetail
      navigation.navigate('SupportMessageDetail', {
        expertName: request.userName,
        expertTitle: request.userTitle,
        expertAvatar: request.userAvatar,
        requestId: requestId,
      });
    }
  };

  const handleFilterPress = (filterId: string) => {
    setActiveFilter(filterId);
  };

  const getFilteredRequests = () => {
    let filtered = supportRequestData.requests;

    // Filter by status
    const activeFilterData = supportRequestData.filters.find(f => f.id === activeFilter);
    if (activeFilterData) {
      switch (activeFilterData.name) {
        case 'Aktif Talepler':
          filtered = filtered.filter(request => request.status === 'active');
          break;
        case 'Sonuçlandırma Bekliyor':
          filtered = filtered.filter(request => request.status === 'pending');
          break;
        case 'Sonuçlandırıldı':
          filtered = filtered.filter(request => request.status === 'completed');
          break;
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.userTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.requestTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.requestDescription.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <VStack flex={1} space="md" px="$4">
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
            placeholder="Destek taleplerinde ara"
            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
            color={isDark ? '#000' : '#000'}
            fontSize={9}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
      </HStack>

      {/* Filter Buttons */}
      <SupportRequestFilterGroup
        filters={supportRequestData.filters}
        activeFilter={activeFilter}
        onFilterPress={handleFilterPress}
      />

      {/* Support Requests List - Full Width */}
      <FlatList
        data={getFilteredRequests()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SupportRequestCard
            data={item}
            onPress={handleRequestPress}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ flex: 1 }}
      />
    </VStack>
    </SafeAreaView>
  );
};

SupportRequestsScreen.displayName = 'SupportRequestsScreen';

export default SupportRequestsScreen;
