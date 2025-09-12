import React, { useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { Box, Text, VStack, HStack, Input, InputField, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { mock_collections } from '@/src/mock/profile/collections';
import { CollectionCard } from '../components/CollectionCard';
import { Collection } from '@/src/mock/profile/collections/types';

const CollectionsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'bridge'>('achievements');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollections = mock_collections.filter(collection =>
    collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: Collection }) => (
    <CollectionCard collection={item} />
  );

  return (
    <VStack flex={1} bg={isDark ? '$backgroundDark900' : '$backgroundLight50'}>
      <Box px="$4" py="$4">
        <Text
          fontSize="$xl"
          fontWeight="$bold"
          color={isDark ? '$textLight0' : '$textDark0'}
          textAlign="center"
          mb="$4"
        >
          Mehmet's Collections
        </Text>

        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={10}
          p="$2"
          mb="$4"
        >
          <HStack space="sm" alignItems="center">
            <Image
              source={require('@/assets/icons/explore.svg')}
              alt="Search"
              w="$6"
              h="$6"
              tintColor={isDark ? '$textLight0' : '$textDark0'}
            />
            <Input
              flex={1}
              variant="unstyled"
              size="md"
            >
              <InputField
                placeholder="Search badge"
                placeholderTextColor={isDark ? '$textLight400' : '$textDark400'}
                color={isDark ? '$textLight0' : '$textDark0'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </HStack>
        </Box>

        <HStack space="md" mb="$4" justifyContent="center">
          <TouchableOpacity onPress={() => setSelectedTab('achievements')}>
            <Box
              bg={selectedTab === 'achievements' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
              borderRadius={100}
              px="$4"
              py="$2"
            >
              <Text
                fontSize="$sm"
                fontWeight="$bold"
                color={isDark ? '$textLight0' : '$textDark0'}
              >
                Achievements Badges
              </Text>
            </Box>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSelectedTab('bridge')}>
            <Box
              bg={selectedTab === 'bridge' ? (isDark ? '$backgroundDark800' : 'rgba(229, 229, 229, 0.8)') : 'transparent'}
              borderWidth={1}
              borderColor={isDark ? '$borderDark700' : '#EFEFEF'}
              borderRadius={100}
              px="$4"
              py="$2"
            >
              <Text
                fontSize="$sm"
                fontWeight="$bold"
                color={selectedTab === 'bridge' ? (isDark ? '$textLight0' : '$textDark0') : '#8C8C8C'}
              >
                Bridge Badges
              </Text>
            </Box>
          </TouchableOpacity>
        </HStack>
      </Box>

      <FlatList
        data={filteredCollections}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 16,
        }}
      />
    </VStack>
  );
};

export default CollectionsScreen;
