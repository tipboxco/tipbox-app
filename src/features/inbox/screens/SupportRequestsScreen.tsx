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
import { toImageSource } from '@/src/utils';
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
  const [activeFilter, setActiveFilter] = useState<string>('all'); // ✅ Default: 'all' (tüm request'leri göster)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const navigation = useNavigation<SupportRequestsScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { isConnected, on, off } = useSocket();
  const acceptMutation = useAcceptSupportRequest();
  const { user } = useAppStore();

  // Filter mapping: UI filter ID -> API status
  const filterStatusMap: Record<string, 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported' | undefined> = {
    'all': undefined, // ✅ Tüm request'leri getir
    'pending': 'pending',
    'active': 'active',
    'awaiting_completion': 'awaiting_completion',
    'completed': 'completed',
  };

  // API params - status undefined ise tüm request'leri getir
  const apiParams = {
    ...(filterStatusMap[activeFilter] ? { status: filterStatusMap[activeFilter] } : {}),
    limit: 50,
  };

  const { data: supportRequests, isLoading, error, refetch } = useSupportRequests(apiParams);
  const supportRequestsArray = Array.isArray(supportRequests) ? supportRequests : [];

  // ✅ Sıralama: active en başta, awaiting_completion ikinci, diğerleri sonra
  const sortedSupportRequests = React.useMemo(() => {
    if (!supportRequestsArray.length) return [];
    
    // Status öncelik sırası: active > awaiting_completion > diğerleri
    const statusPriority: Record<string, number> = {
      'active': 1, // En yüksek öncelik
      'awaiting_completion': 2,
      'pending': 3,
      'completed': 4,
      'rejected': 5,
      'canceled': 6,
      'reported': 7,
    };
    
    return [...supportRequestsArray].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;
      
      // Önce status önceliğine göre sırala
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Aynı status ise timestamp'e göre (en yeni en üstte)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [supportRequestsArray]);

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

  // ✅ FIX: Support request closed handler (awaiting_completion durumuna geçer)
  const handleSupportRequestClosed = useCallback((data: { requestId: string; timestamp?: string }) => {
    console.log('[SupportRequestsScreen] ✅ Support request closed:', data);
    
    // ✅ Optimistic update - Request'i anında awaiting_completion status'e çek
    queryClient.setQueryData(inboxKeys.supportRequests(), (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      
      return oldData.map((request: any) => {
        if (request.id === data.requestId) {
          return {
            ...request,
            status: 'awaiting_completion', // ✅ Close yapıldığında awaiting_completion olur
          };
        }
        return request;
      });
    });
    
    // Invalidate queries to refresh the list (backend'den güncel veri çek)
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [queryClient]);

  // ✅ FIX: Support request finalized handler (completed durumuna geçer)
  const handleSupportRequestFinalized = useCallback((data: { requestId: string; timestamp?: string }) => {
    console.log('[SupportRequestsScreen] ✅ Support request finalized:', data);
    
    // ✅ Optimistic update - Request'i anında completed status'e çek
    queryClient.setQueryData(inboxKeys.supportRequests(), (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      
      return oldData.map((request: any) => {
        if (request.id === data.requestId) {
          return {
            ...request,
            status: 'completed', // ✅ Finalize yapıldığında completed olur
          };
        }
        return request;
      });
    });
    
    // Invalidate queries to refresh the list (backend'den güncel veri çek)
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
    on('support_request_closed', handleSupportRequestClosed); // ✅ FIX: Close request event'ini dinle (awaiting_completion)
    on('support_request_finalized', handleSupportRequestFinalized); // ✅ FIX: Finalized event'ini dinle (completed)
    on('new_message', handleNewMessage);

    return () => {
      off('support_request_accepted', handleSupportRequestAccepted);
      off('support_request_rejected', handleSupportRequestRejected);
      off('support_request_cancelled', handleSupportRequestCancelled);
      off('support_request_closed', handleSupportRequestClosed); // ✅ FIX: Close request event listener'ını temizle
      off('support_request_finalized', handleSupportRequestFinalized); // ✅ FIX: Finalized event listener'ını temizle
      off('new_message', handleNewMessage);
    };
  }, [isConnected, on, off, handleSupportRequestAccepted, handleSupportRequestRejected, handleSupportRequestCancelled, handleSupportRequestClosed, handleSupportRequestFinalized, handleNewMessage]);

  const handleRequestPress = (requestId: string) => {
    // Find the request data
    const request = supportRequests?.find(r => r.id === requestId);
    
    if (!request) return;
    
    // Tüm durumlar için SupportMessageDetail ekranını kullan
    // Request'i oluşturan kullanıcının bilgileri (user olarak)
    // Yeni yapı: request.sender, Eski yapı: request.userName/userTitle/userAvatar (backward compatibility)
    const userName = request.sender?.senderName || request.userName || 'Unknown';
    const userTitle = request.sender?.senderTitle || request.userTitle || '';
    
    // Avatar URL logları
    const rawUserAvatar = request.sender?.senderAvatar || request.userAvatar;
    console.log('[SupportRequestsScreen] handleRequestPress - User Avatar URLs:', {
      requestId,
      rawUserAvatar,
      userAvatarType: typeof rawUserAvatar,
      userAvatarAfterToImageSource: rawUserAvatar ? toImageSource(rawUserAvatar) : null,
    });
    
    const userAvatar = rawUserAvatar ? (toImageSource(rawUserAvatar) || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR;
    
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
        // Yeni yapı: request.sender, Eski yapı: request.userName/userTitle/userAvatar (backward compatibility)
        const userName = request.sender?.senderName || request.userName || 'Unknown';
        const userTitle = request.sender?.senderTitle || request.userTitle || '';
        
        // User Avatar URL logları
        const rawUserAvatar = request.sender?.senderAvatar || request.userAvatar;
        console.log('[SupportRequestsScreen] handleAccept - User Avatar URLs:', {
          requestId,
          rawUserAvatar,
          userAvatarType: typeof rawUserAvatar,
          userAvatarAfterToImageSource: rawUserAvatar ? toImageSource(rawUserAvatar) : null,
        });
        
        const userAvatar = rawUserAvatar ? (toImageSource(rawUserAvatar) || DEFAULT_USER_AVATAR) : DEFAULT_USER_AVATAR;
        
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
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Filter options for UI
  const filterOptions = [
    { id: 'all', name: 'All' }, // ✅ Tüm request'leri göster
    { id: 'pending', name: 'Awaiting Resolution' },
    { id: 'active', name: 'Active Requests' },
    { id: 'awaiting_completion', name: 'Awaiting Completion' },
    { id: 'completed', name: 'Completed' },
  ];

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <VStack flex={1} space="md" px="$4">
        {/* Filter Buttons */}
        <Box mt="$4">
          <SupportRequestFilterGroup
            filters={filterOptions.map(f => ({ id: f.id, name: f.name, isActive: activeFilter === f.id }))}
            activeFilter={activeFilter}
            onFilterPress={handleFilterPress}
          />
        </Box>

        {/* Support Requests List - Full Width */}
        {error ? (
          <Box py={20} alignItems="center">
            <Text color="#CE4A4A">Error: {error.message}</Text>
          </Box>
        ) : (
          <FlatList
            data={sortedSupportRequests}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <SupportRequestCard
                data={item}
                onPress={handleRequestPress}
                onAccept={handleAccept}
              />
            )}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: sortedSupportRequests.length === 0 ? 1 : 0,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isManualRefreshing}
                onRefresh={handleRefresh}
                tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
              />
            }
            ListEmptyComponent={
              !isLoading ? (
                <Box py={40} alignItems="center" justifyContent="center" flex={1}>
                  <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>No support requests yet</Text>
                </Box>
              ) : null
            }
          />
        )}
      </VStack>
    </Box>
  );
};

SupportRequestsScreen.displayName = 'SupportRequestsScreen';

export default SupportRequestsScreen;
