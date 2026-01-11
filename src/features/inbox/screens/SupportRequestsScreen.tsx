import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl } from 'react-native';
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
import SupportRequestCard from '../components/SupportRequestCard/index';
import SupportRequestFilterGroup from '../components/SupportRequestFilterGroup/index';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useSupportRequests, useAcceptSupportRequest } from '../api/hooks';
import { useSocket } from '@/src/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { inboxKeys } from '../api/hooks';
import type { SupportRequest } from '../api/messagesApi';
import { Alert } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { SupportRequestSkeleton } from '@/src/components/Skeletons';

type SupportRequestsScreenNavigationProp = NativeStackNavigationProp<any, 'SupportRequestsScreen'>;

// Default user avatar
const DEFAULT_USER_AVATAR = require('@/assets/avatar/default-useravatar.png');

const SupportRequestsScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeFilter, setActiveFilter] = useState<string>('pending');
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
    limit: 50,
  };

  const { data: supportRequests, isLoading, error, refetch, isRefetching } = useSupportRequests(apiParams);
  const supportRequestsArray = Array.isArray(supportRequests) ? supportRequests : [];

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
    
    // Avatar URL logları
    console.log('[SupportRequestsScreen] handleRequestPress - User Avatar URLs:', {
      requestId,
      rawUserAvatar: request.userAvatar,
      userAvatarType: typeof request.userAvatar,
      userAvatarAfterToImageSource: request.userAvatar ? toImageSource(request.userAvatar) : null,
    });
    
    const userAvatar = request.userAvatar ? (toImageSource(request.userAvatar) || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR;
    
    // Mevcut kullanıcının bilgileri (expert olarak - request'i kabul eden/edebilecek kişi)
    const expertName = user?.fullName || 'Expert';
    const expertTitle = ''; // User interface'inde title yok
    
    // Expert Avatar URL logları
    console.log('[SupportRequestsScreen] handleRequestPress - Expert Avatar URLs:', {
      requestId,
      rawExpertAvatar: user?.avatar,
      expertAvatarType: typeof user?.avatar,
      expertAvatarAfterToImageSource: user?.avatar ? toImageSource(user.avatar) : null,
    });
    
    const expertAvatar = user?.avatar ? (toImageSource(user.avatar) || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR;
    
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
      Alert.alert('Error', 'Support request not found');
      return;
    }

    // Accept support request mutation
    acceptMutation.mutate(requestId, {
      onSuccess: (data) => {
        console.log('[SupportRequestsScreen] ✅ Support request accepted, threadId:', data.threadId);
        
        // Mevcut kullanıcının bilgileri (expert olarak)
        const expertName = user?.fullName || 'Expert';
        const expertTitle = '';
        
        // Expert Avatar URL logları
        console.log('[SupportRequestsScreen] handleAccept - Expert Avatar URLs:', {
          requestId,
          rawExpertAvatar: user?.avatar,
          expertAvatarType: typeof user?.avatar,
          expertAvatarAfterToImageSource: user?.avatar ? toImageSource(user.avatar) : null,
        });
        
        const expertAvatar = user?.avatar ? (toImageSource(user.avatar) || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR;
        
        // Request'i oluşturan kullanıcının bilgileri (user olarak)
        const userName = request.userName;
        const userTitle = request.userTitle;
        
        // User Avatar URL logları
        console.log('[SupportRequestsScreen] handleAccept - User Avatar URLs:', {
          requestId,
          rawUserAvatar: request.userAvatar,
          userAvatarType: typeof request.userAvatar,
          userAvatarAfterToImageSource: request.userAvatar ? toImageSource(request.userAvatar) : null,
        });
        
        const userAvatar = request.userAvatar ? (toImageSource(request.userAvatar) || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR;
        
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
        Alert.alert('Error', error.message || 'Support request could not be accepted');
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
    { id: 'pending', name: 'Awaiting Resolution' },
    { id: 'active', name: 'Active Requests' },
    { id: 'awaiting_completion', name: 'Awaiting Completion' },
    { id: 'completed', name: 'Completed' },
  ];

  return (
    <VStack flex={1} space="md" px="$4">
      {/* Filter Buttons */}
      <SupportRequestFilterGroup
        filters={filterOptions.map(f => ({ id: f.id, name: f.name, isActive: activeFilter === f.id }))}
        activeFilter={activeFilter}
        onFilterPress={handleFilterPress}
      />

      {/* Support Requests List - Full Width */}
      {isLoading && !supportRequests ? (
        <SupportRequestSkeleton count={5} />
      ) : error ? (
        <Box py={20} alignItems="center">
          <Text color="#CE4A4A">Hata: {error.message}</Text>
        </Box>
      ) : (
        <FlatList
          data={supportRequestsArray}
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
              <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>No support requests found</Text>
            </Box>
          }
        />
      )}
    </VStack>
  );
};

SupportRequestsScreen.displayName = 'SupportRequestsScreen';

export default SupportRequestsScreen;
