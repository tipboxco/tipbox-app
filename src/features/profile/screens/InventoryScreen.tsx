import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import { VStack, Box, Input, InputField, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { mock_inventory } from '@/src/mock/inventory';
import { ProfileStackParamList } from '../navigation';
import { InventoryItem } from '../types';
import InventoryCard from '../components/InventoryCard';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import type { RootStackParamList } from '@/src/navigation/navigation.types';

const { width } = Dimensions.get('window');
const CARD_GAP = 6;
const CARDS_PER_ROW = 3;
const HORIZONTAL_PADDING = 15;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;

type InventoryScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList & RootStackParamList> & {
  navigate: (name: any, params?: any) => void;
};

const InventoryScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const navigation = useNavigation<InventoryScreenNavigationProp>();
  
  // Bottom sheet refs
  const createPostBottomSheetRef = useRef<BottomSheet>(null);

  const filteredInventory = mock_inventory.flatMap(group => 
    group.items.filter(item => 
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specs.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreatePress = () => {
    console.log('Create button pressed');
    if (createPostBottomSheetRef.current) {
      createPostBottomSheetRef.current.expand();
      setIsBottomSheetOpen(true);
    } else {
      setTimeout(() => {
        if (createPostBottomSheetRef.current) {
          createPostBottomSheetRef.current.expand();
          setIsBottomSheetOpen(true);
        }
      }, 100);
    }
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setIsBottomSheetOpen(false);
    } else {
      setIsBottomSheetOpen(true);
    }
  }, []);

  const handlePostTypeSelect = (type: string, experienceOption?: 'own' | 'tried') => {
    console.log('Post type selected:', type, 'experienceOption:', experienceOption);
    
    // Close bottom sheet first
    createPostBottomSheetRef.current?.close();
    
    // Navigate to CreateExperiencePostScreen
    if (type === 'experience') {
      navigation.navigate('Post', {
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

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    []
  );

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
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        columnWrapperStyle={{ gap: CARD_GAP }}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Button */}
      <Pressable
        onPress={handleCreatePress}
        position="absolute"
        bottom={Platform.OS === 'ios' ? 8 : 8}
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
          <Feather name="edit-3" size={24} color="#000000" />
        </Box>
      </Pressable>

      {/* Create Post Bottom Sheet */}
      <BottomSheet
        ref={createPostBottomSheetRef}
        index={-1}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        enableDynamicSizing
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView>
          <CreatePostBottomSheet
            onClose={() => {
              createPostBottomSheetRef.current?.close();
            }}
            onPostTypeSelect={handlePostTypeSelect}
            onViewChange={handleViewChange}
            showExperienceOptionsDirectly={true}
          />
        </BottomSheetView>
      </BottomSheet>
      </VStack>
    </SafeAreaView>
  );
};

export default InventoryScreen;
