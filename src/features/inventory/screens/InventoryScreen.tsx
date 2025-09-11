import React, { useState } from 'react';
import { FlatList, Dimensions } from 'react-native';
import { VStack, Box, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { mock_inventory } from '@/src/mock/inventory';
import { Search, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import InventoryCard from '../components/InventoryCard';

const { width } = Dimensions.get('window');
const CARD_GAP = 6;
const CARDS_PER_ROW = 3;
const HORIZONTAL_PADDING = 15;
const CARD_WIDTH = (width - (HORIZONTAL_PADDING * 2) - (CARD_GAP * (CARDS_PER_ROW - 1))) / CARDS_PER_ROW;

const InventoryScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const filteredInventory = mock_inventory.flatMap(group => 
    group.items.filter(item => 
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specs.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
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
    </VStack>
  );
};

export default InventoryScreen;