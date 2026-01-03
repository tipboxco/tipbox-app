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
import SupportRequestCard from '../components/SupportRequestCard/index';
import SupportRequestFilterGroup from '../components/SupportRequestFilterGroup/index';
import { useSafeAreaValues } from '@/src/utils';
import { useSupportRequests, useAcceptSupportRequest } from '../api/hooks';
import { useSocket } from '@/src/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { inboxKeys } from '../api/hooks';
import type { SupportRequest } from '../api/messagesApi';
import { Alert } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { toImageSource } from '@/src/utils';

type SupportRequestsScreenNavigationProp = NativeStackNavigationProp<any, 'SupportRequestsScreen'>;

const SupportRequestsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeFilter, setActiveFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<SupportRequestsScreenNavigationProp>();
  const bottomInset = useSafeAreaValues('bottom');
  const queryClient = useQueryClient();
  const { isConnected, on, off } = useSocket();
  const acceptMutation = useAcceptSupportRequest();
  const { user } = useAppStore();

  // Filter mapping: UI filter ID -> API status
  const filterStatusMap: Record<string, 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported' | undefined> = {
    'pending': 'pending',
    'active': 'active',
    'awaiting_completion': 'awaiting_completion',
    'completed': 'completed',
  };

  // API params
  const apiParams = {
    status: filterStatusMap[activeFilter],
    search: searchQuery || undefined,
    limit: 50,
  };

  const { data: supportRequests, isLoading, error, refetch, isRefetching } = useSupportRequests(apiParams);

  // Socket event handlers
  const handleSupportRequestAccepted = useCallback((data: { requestId: string; threadId: string; timestamp: string }) => {
    console.log('[SupportRequestsScreen] Support request accepted:', data);
    // Invalidate queries to refresh the list
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [queryClient]);

  const handleSupportRequestRejected = useCallback((data: { requestId: string; timestamp: string }) => {
    console.log('[SupportRequestsScreen] Support request rejected:', data);
    // Invalidate queries to refresh the list
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [queryClient]);

  const handleSupportRequestCancelled = useCallback((data: { requestId: string; timestamp: string }) => {
    console.log('[SupportRequestsScreen] Support request cancelled:', data);
    // Invalidate queries to refresh the list
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [queryClient]);

  const handleNewMessage = useCallback((eventData: any) => {
    // Support request mesajı geldiğinde listeyi güncelle
    if (eventData.messageType === 'support-request') {
      console.log('[SupportRequestsScreen] New support request message:', eventData);
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    }
  }, [queryClient]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    on('support_request_accepted', handleSupportRequestAccepted);
    on('support_request_rejected', handleSupportRequestRejected);
    on('support_request_cancelled', handleSupportRequestCancelled);
    on('new_message', handleNewMessage);

    return () => {
      off('support_request_accepted', handleSupportRequestAccepted);
      off('support_request_rejected', handleSupportRequestRejected);
      off('support_request_cancelled', handleSupportRequestCancelled);
      off('new_message', handleNewMessage);
    };
  }, [isConnected, on, off, handleSupportRequestAccepted, handleSupportRequestRejected, handleSupportRequestCancelled, handleNewMessage]);

  const handleRequestPress = (requestId: string) => {
    // Find the request data
    const request = supportRequests?.find(r => r.id === requestId);
    
    if (!request) return;
    
    // Tüm durumlar için SupportMessageDetail ekranını kullan
    // Request'i oluşturan kullanıcının bilgileri (user olarak)
    const userName = request.userName;
    const userTitle = request.userTitle;
    const userAvatar = request.userAvatar ? toImageSource(request.userAvatar) : require('@/assets/avatar/ozan.png');
    
    // Mevcut kullanıcının bilgileri (expert olarak - request'i kabul eden/edebilecek kişi)
    const expertName = user?.fullName || 'Expert';
    const expertTitle = ''; // User interface'inde title yok
    const expertAvatar = user?.avatar ? toImageSource(user.avatar) : require('@/assets/avatar/ozan.png');
    
    // SupportMessageDetail'e yönlendir (tüm durumlar için)
    navigation.navigate('SupportMessageDetail', {
      expertName: expertName,
      expertTitle: expertTitle,
      expertAvatar: expertAvatar,
      userName: userName,
      userTitle: userTitle,
      userAvatar: userAvatar,
      requestId: requestId,
      status: request.status,
      threadId: request.threadId || null, // Thread oluşmamışsa null
    });
  };

  const handleAccept = (requestId: string) => {
    // Find the request data
    const request = supportRequests?.find(r => r.id === requestId);
    
    if (!request) {
      Alert.alert('Hata', 'Destek talebi bulunamadı');
      return;
    }

    // Accept support request mutation
    acceptMutation.mutate(requestId, {
      onSuccess: (data) => {
        console.log('[SupportRequestsScreen] ✅ Support request accepted, threadId:', data.threadId);
        
        // Mevcut kullanıcının bilgileri (expert olarak)
        const expertName = user?.fullName || 'Expert';
        const expertTitle = '';
        const expertAvatar = user?.avatar ? toImageSource(user.avatar) : require('@/assets/avatar/ozan.png');
        
        // Request'i oluşturan kullanıcının bilgileri (user olarak)
        const userName = request.userName;
        const userTitle = request.userTitle;
        const userAvatar = request.userAvatar ? toImageSource(request.userAvatar) : require('@/assets/avatar/ozan.png');
        
        // Yeni oluşturulan thread ile SupportMessageDetail ekranına yönlendir
        navigation.navigate('SupportMessageDetail', {
          expertName: expertName,
          expertTitle: expertTitle,
          expertAvatar: expertAvatar,
          userName: userName,
          userTitle: userTitle,
          userAvatar: userAvatar,
          requestId: requestId,
          status: 'active',
          threadId: data.threadId,
        });
      },
      onError: (error: any) => {
        console.error('[SupportRequestsScreen] ❌ Support request accept error:', error);
        Alert.alert('Hata', error.message || 'Destek talebi kabul edilemedi');
      },
    });
  };

  const handleFilterPress = (filterId: string) => {
    setActiveFilter(filterId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter options for UI
  const filterOptions = [
    { id: 'pending', name: 'Sonuçlandırma Bekliyor' },
    { id: 'active', name: 'Aktif Talepler' },
    { id: 'awaiting_completion', name: 'Tamamlanma Bekliyor' },
    { id: 'completed', name: 'Sonuçlandırıldı' },
  ];

  return (
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
        filters={filterOptions.map(f => ({ id: f.id, name: f.name, isActive: activeFilter === f.id }))}
        activeFilter={activeFilter}
        onFilterPress={handleFilterPress}
      />

      {/* Support Requests List - Full Width */}
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
          data={supportRequests || []}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SupportRequestCard
              data={item}
              onPress={handleRequestPress}
              onAccept={handleAccept}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: bottomInset }}
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
            />
          }
          ListEmptyComponent={
            <Box py={20} alignItems="center">
              <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>Destek talebi bulunamadı</Text>
            </Box>
          }
        />
      )}
    </VStack>
  );
};

SupportRequestsScreen.displayName = 'SupportRequestsScreen';

export default SupportRequestsScreen;
