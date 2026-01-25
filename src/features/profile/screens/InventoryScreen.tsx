import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { Search } from 'lucide-react-native';
import { VStack, HStack, Box, Input, InputField, Pressable, Text } from '@gluestack-ui/themed';
import { PlusIcon } from 'react-native-heroicons/outline';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { Platform } from 'react-native';

import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProfileStackParamList } from '../navigation';
import type { InventoryItem } from '../types';
import InventoryCard from '../components/InventoryCard';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useInventory, useDeleteInventoryItem, useUserProfile } from '../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { InventorySkeleton } from '@/src/components/Skeletons';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_GAP = 6;
const CARDS_PER_ROW = 3;
const HORIZONTAL_PADDING = 15;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;
const TAB_BAR_HEIGHT = 50; // ProfileScreen'deki TabBar height

type InventoryScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList & RootStackParamList> & {
  navigate: (name: any, params?: any) => void;
};

type InventoryScreenRouteProp = RouteProp<ProfileStackParamList, 'InventoryList'>;

const InventoryScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<InventoryScreenNavigationProp>();
  const route = useRoute<InventoryScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAppStore();
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Route params'tan userId, selectMode ve returnScreen al
  const { userId, selectMode, returnScreen } = route.params;
  
  // SecureStore'daki user_id (appStore'dan)
  const currentUserId = user?.id;
  
  // Create Button'u sadece kendi envanteri ise göster
  // EventCreatePost'tan geliyorsa (selectMode === 'event') Create butonunu gizle
  const showCreateButton = currentUserId === userId && selectMode !== 'event';

  // Get user profile to display name in header
  const { data: userProfile } = useUserProfile(userId);

  // API'den envanter ürünlerini getir (pagination ile)
  const LIMIT = 20;
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInventory(LIMIT);

  // Delete inventory item mutation
  const { mutate: deleteInventoryItem, isPending: isDeleting } = useDeleteInventoryItem();

  // Tüm sayfalardaki item'ları birleştir
  const allInventoryItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  // API'den gelen verileri filtrele
  const filteredInventory = useMemo(() => {
    if (!allInventoryItems || allInventoryItems.length === 0) return [];

    return allInventoryItems.filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.brand.name.toLowerCase().includes(query) ||
        item.brand.model.toLowerCase().includes(query) ||
        item.brand.specs.toLowerCase().includes(query)
      );
    });
  }, [allInventoryItems, searchQuery]);

  // Infinite scroll handler
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCreatePress = () => {
    console.log('Create button pressed');
    openBottomSheet(
      <CreatePostBottomSheet
        onClose={closeBottomSheet}
        onPostTypeSelect={handlePostTypeSelect}
        onViewChange={handleViewChange}
        showExperienceOptionsDirectly={true}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 45 + 8,
      }
    );
  };

  const handlePostTypeSelect = (type: string, experienceOption?: 'own' | 'tried') => {
    console.log('Post type selected:', type, 'experienceOption:', experienceOption);
    
    // Close bottom sheet first
    closeBottomSheet();
    
    // Navigate to ProductSelectScreen with experienceOption
    if (type === 'experience' && experienceOption) {
      navigationService.navigate(ROOT_ROUTES.PRODUCT_SELECT, {
        returnScreen: 'CreateExperiencePostScreen',
        experienceOption: experienceOption,
      });
    }
  };

  const handleViewChange = (view: 'options' | 'experience') => {
    console.log('BottomSheet view changed:', view);
  };

  // Handle update experience - CreateExperiencePostScreen'e yönlendir
  const handleUpdateExperience = useCallback((item: InventoryItem) => {
    console.log('[InventoryScreen] Update experience for item:', item.id);
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CreateExperiencePostScreen',
      params: {
        product: {
          id: item.id,
          name: `${item.brand.name} ${item.brand.model}`,
          image: item.image,
        },
        fromInventory: true,
        experienceOption: item.hasOwned ? 'own' : 'tried',
      },
    });
  }, []);

  // Handle delete product
  const handleDeleteProduct = useCallback((item: InventoryItem) => {
    console.log('[InventoryScreen] Delete product:', item.id);
    Alert.alert(
      'Ürünü Sil',
      'Bu ürünü envanterinizden silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteInventoryItem(item.id);
          },
        },
      ]
    );
  }, [deleteInventoryItem]);


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title={userProfile?.name ? `${userProfile.name}'s Inventory` : 'Inventory'}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <VStack
        space="md"
        pb="$4"
        px="$4"
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      >
        <HStack
          alignItems="center"
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderWidth={1}
          borderColor="#E9E9E9"
          borderRadius={20}
          px={14}
          space="sm"
        >
          <Search size={24} color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} />
          <Input flex={1} borderWidth={0} bg="transparent">
            <InputField
              placeholder="Search product in your inventory"
              placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
              color={isDark ? '#000' : '#000'}
              fontSize="$sm"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        </HStack>
      </VStack>

      {isLoading ? (
        <InventorySkeleton count={9} cardWidth={CARD_WIDTH} />
      ) : isError ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="#CE4A4A">Hata: Envanter yüklenirken bir sorun oluştu</Text>
        </Box>
      ) : (
        <FlatList
          data={filteredInventory}
          renderItem={({ item }) => (
            <InventoryCard
              item={item}
              width={CARD_WIDTH}
              onPress={() => {
                // If selectMode is 'event', navigate back to EventCreatePost with product
                if (selectMode === 'event' && returnScreen === 'EventCreatePost') {
                  // Get current EventCreatePost route params to preserve eventId
                  // Try to get from navigation state first (more reliable)
                  let currentEventCreatePostParams: any = null;
                  try {
                    const navState = navigation.getState();
                    // Find EventCreatePost in navigation state
                    const findEventCreatePost = (routes: any[]): any => {
                      for (const route of routes) {
                        if (route.name === 'EventCreatePost' && route.params) {
                          return route.params;
                        }
                        if (route.state?.routes) {
                          const found = findEventCreatePost(route.state.routes);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    currentEventCreatePostParams = findEventCreatePost(navState.routes || []);
                  } catch (error) {
                    console.warn('[InventoryScreen] Failed to get navigation state:', error);
                  }
                  
                  // Fallback to getCurrentRoute if navigation state doesn't work
                  if (!currentEventCreatePostParams) {
                    const currentRoute = navigationService.getCurrentRoute();
                    currentEventCreatePostParams = currentRoute?.name === 'EventCreatePost' 
                      ? currentRoute.params 
                      : null;
                  }
                  
                  console.log('🔍 [InventoryScreen] EventCreatePost params:', currentEventCreatePostParams);
                  console.log('📦 [InventoryScreen] Selected inventory item:', {
                    inventoryItemId: item.id,
                    productId: item.productId,
                    brand: item.brand,
                  });
                  
                  // Navigate back to EventCreatePost with selected product and preserve eventId
                  // Use goBack() to prevent stack loop (EventCreatePost -> InventoryScreen -> EventCreatePost)
                  // Then navigate with updated params - EventCreatePost will handle the update via route params
                  if (navigation.canGoBack()) {
                    // Go back to EventCreatePost (removes InventoryScreen from stack)
                    navigation.goBack();
                    
                    // Update EventCreatePost params after goBack
                    // Use a small delay to ensure goBack completes
                    setTimeout(() => {
                      navigationService.navigate(ROOT_ROUTES.EVENT, {
                        screen: 'EventCreatePost',
                        params: {
                          ...(currentEventCreatePostParams || {}), // Preserve existing params (eventId, eventType, etc.)
                          selectedInventoryProduct: item, // ✅ Tüm InventoryItem'ı gönder (inventoryId + productId var)
                        },
                      });
                    }, 100);
                  } else {
                    // Fallback: use navigationService (if can't go back)
                    navigationService.navigate(ROOT_ROUTES.EVENT, {
                      screen: 'EventCreatePost',
                      params: {
                        ...(currentEventCreatePostParams || {}), // Preserve existing params (eventId, eventType, etc.)
                        selectedInventoryProduct: item, // ✅ Tüm InventoryItem'ı gönder
                      },
                    });
                  }
                } else {
                  // Normal flow: navigate to InventoryDetail
                  navigation.navigate('InventoryDetail', { itemId: item.id });
                }
              }}
              onUpdateExperience={handleUpdateExperience}
              onDeleteProduct={handleDeleteProduct}
              isOwnProfile={showCreateButton}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={CARDS_PER_ROW}
          contentContainerStyle={{ 
            paddingHorizontal: HORIZONTAL_PADDING,
            paddingBottom: TAB_BAR_HEIGHT + 12 // TabBar height + 12px
          }}
          columnWrapperStyle={{ gap: CARD_GAP }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Box flex={1} justifyContent="center" alignItems="center" py={40} px="$4">
              <VStack alignItems="center" space="md">
                <PlusIcon 
                  width={48} 
                  height={48} 
                  color={isDark ? '#666666' : '#B9B9B9'} 
                  strokeWidth={1.5}
                />
                <Text 
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize="$md"
                  textAlign="center"
                >
                  {searchQuery ? 'No search results found' : 'Inventory is empty'}
                </Text>
                {!searchQuery && showCreateButton && (
                  <Pressable
                    onPress={handleCreatePress}
                    mt="$2"
                  >
                    <Box
                      bg="#E8FF6B"
                      borderRadius={8}
                      px="$4"
                      py="$2"
                    >
                      <Text color="#000000" fontSize="$md" fontWeight="$semibold">
                        Add Product
                      </Text>
                    </Box>
                  </Pressable>
                )}
              </VStack>
            </Box>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <Box py={20} alignItems="center">
                <InventorySkeleton count={3} cardWidth={CARD_WIDTH} />
              </Box>
            ) : null
          }
        />
      )}

      {/* Create Button - Sadece kendi envanteri ise göster */}
      {showCreateButton && (
        <Pressable
          onPress={handleCreatePress}
          position="absolute"
          bottom={insets.bottom + 8} // bottom.inset + tabbar height + 8px
          right={16}
        >
        <Box
          bg="#E8FF6B"
          borderRadius={30}
          width={56}
          height={56}
          alignItems="center"
          justifyContent="center"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.3}
          shadowRadius={4.65}
          elevation={8}
        >
          <PlusIcon width={24} height={24} color="#000000" />
        </Box>
      </Pressable>
      )}

      {/* Create Post Bottom Sheet */}
      </VStack>
    </SafeAreaView>
  );
};

export default InventoryScreen;
