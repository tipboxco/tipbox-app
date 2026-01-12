import React, { useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { FlatList, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { Search } from 'lucide-react-native';
import { VStack, Box, Input, InputField, Pressable, Text } from '@gluestack-ui/themed';
import { PencilSquareIcon } from 'react-native-heroicons/outline';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';

import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProfileStackParamList } from '../navigation';
import type { InventoryItem } from '../types';
import InventoryCard from '../components/InventoryCard';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useInventory } from '../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { InventorySkeleton } from '@/src/components/Skeletons';

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
  
  // Route params'tan userId al
  const { userId } = route.params;
  
  // SecureStore'daki user_id (appStore'dan)
  const currentUserId = user?.id;
  
  // Create Button'u sadece kendi envanteri ise göster
  const showCreateButton = currentUserId === userId;

  // API'den envanter ürünlerini getir
  const { data: inventoryItems, isLoading, isError } = useInventory();

  // API'den gelen verileri filtrele
  const filteredInventory = useMemo(() => {
    if (!inventoryItems) return [];

    return inventoryItems.filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.brand.name.toLowerCase().includes(query) ||
        item.brand.model.toLowerCase().includes(query) ||
        item.brand.specs.toLowerCase().includes(query)
      );
    });
  }, [inventoryItems, searchQuery]);

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
    
    // Navigate to CreateExperiencePostScreen
    if (type === 'experience') {
      navigationService.navigate(ROOT_ROUTES.POST, {
        screen: 'CreateExperiencePostScreen',
        params: {
          product: undefined,
          fromInventory: true,
          experienceOption: experienceOption,
        },
      });
    }
  };

  const handleViewChange = (view: 'options' | 'experience') => {
    console.log('BottomSheet view changed:', view);
  };


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Inventory"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <Box px={15} py={10}>
        <Input
          variant="outline"
          size="md"
          borderRadius={5}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          bg={isDark ? '$backgroundDark800' : '$white'}
        >
          <Box
            position="absolute"
            left={15}
            height="100%"
            alignItems="center"
            justifyContent="center"
            zIndex={1}
          >
            <Search size={16} color={isDark ? '#666666' : '#B9B9B9'} strokeWidth={2.5} />
          </Box>
          <InputField
            pl={45}
            placeholder="Search product in your inventory"
            placeholderTextColor={isDark ? '#666666' : '#B9B9B9'}
            fontSize={11}
            color={isDark ? '$textDark50' : '#000'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Input>
      </Box>

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
              onPress={() => navigation.navigate('InventoryDetail', { itemId: item.id })}
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
          ListEmptyComponent={
            <Box flex={1} justifyContent="center" alignItems="center" py={40}>
              <Text color={isDark ? '$textDark400' : '$textLight600'}>
                {searchQuery ? 'No search results found' : 'Inventory is empty'}
              </Text>
            </Box>
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
          <PencilSquareIcon width={24} height={24} color="#000000" />
        </Box>
      </Pressable>
      )}

      {/* Create Post Bottom Sheet */}
      </VStack>
    </SafeAreaView>
  );
};

export default InventoryScreen;
