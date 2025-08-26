import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Pressable,
  Image,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { Header } from '../../../components/Header';
import { forYourInterestCards, exploreCards, categories } from '../../../mock/bridge/bridgeCards';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '@/src/store/themeStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BridgeStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<BridgeStackParamList>;

export const BridgeScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const { colorMode } = useThemeStore();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NavigationProp>();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleCardPress = (brand: typeof forYourInterestCards[0]) => {
    navigation.navigate('BridgeDetail', {
      brandId: brand.id,
      brandName: brand.name,
      brandDescription: brand.description,
      followers: brand.followers,
      logo: brand.logo,
      banner: brand.banner,
    });
  };

  const renderBrandCard = (brand: typeof forYourInterestCards[0]) => (
    <Pressable
      key={brand.id}
      onPress={() => handleCardPress(brand)}
    >
      <Box
        bg={isDark ? '$backgroundDark800' : '$backgroundLight0'}
        borderRadius={10}
        p={12}
        mb={8}
        shadowColor="$black"
        shadowOffset={{ width: 0, height: 0 }}
        shadowOpacity={0.25}
        shadowRadius={3}
      >
        <HStack space="md" alignItems="center">
          <Box
            width={64}
            height={64}
            borderRadius={5}
            bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
          >
            <Image
              source={brand.logo}
              alt={brand.name}
              width={64}
              height={64}
              borderRadius={5}
            />
          </Box>
          <VStack flex={1} space="xs">
            <Text
              fontWeight="$bold"
              fontSize={12}
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              {brand.name}
            </Text>
            <Text
              fontSize={9}
              color={isDark ? '$textDark400' : '$textLight500'}
              numberOfLines={2}
            >
              {brand.description}
            </Text>
            <HStack alignItems="center" space="sm" mt={4}>
              <Box>
                <Feather name="users" size={14} color={isDark ? '#666' : '#999'} />
              </Box>
              <Text
                fontSize={9}
                color={isDark ? '$textDark300' : '$textLight400'}
              >
                {(brand.followers / 1000).toFixed(0)}K Followers
              </Text>
            </HStack>
          </VStack>
          <Pressable
            width={24}
            height={24}
            justifyContent="center"
            alignItems="center"
          >
            <Box>
              <Feather name="bookmark" size={14} color={isDark ? '#666' : '#999'} />
            </Box>
          </Pressable>
        </HStack>
      </Box>
    </Pressable>
  );

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark900' : '$backgroundLight0'}
    >
      <Header 
        title="Bridge" 
        showBackButton 
        onBackPress={handleBackPress}
      />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Search Input */}
        <Box px="$4" mt="$4">
          <Input
            variant="outline"
            size="md"
            borderRadius={10}
            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
            backgroundColor={isDark ? '$backgroundDark800' : '$backgroundLight50'}
          >
            <HStack alignItems="center" px="$3" flex={1}>
              <Box mr="$2">
                <Feather name="search" size={16} color={isDark ? '#666' : '#999'} />
              </Box>
              <InputField
                flex={1}
                placeholder="Search"
                placeholderTextColor={isDark ? '$textDark400' : '$textLight400'}
                color={isDark ? '$textDark50' : '$textLight900'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </HStack>
          </Input>
        </Box>

        {/* For Your Interest Section */}
        <Box px="$4" mt="$6">
          <Text
            fontSize={14}
            fontWeight="$bold"
            mb="$4"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            For Your Interest
          </Text>
          
          {forYourInterestCards.map(renderBrandCard)}
        </Box>

        {/* Explore Section */}
        <Box px="$4" mt="$6">
          <Text
            fontSize={14}
            fontWeight="$bold"
            mb="$4"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Explore
          </Text>
          
          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <HStack space="sm">
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Box
                    bg={selectedCategory === category.id
                      ? isDark ? '$backgroundDark700' : '$backgroundLight100'
                      : 'transparent'
                    }
                    borderWidth={1}
                    borderColor={isDark ? '$borderDark700' : '$borderLight200'}
                    borderRadius={10}
                    px="$3"
                    py="$1"
                  >
                    <Text
                      fontSize={9}
                      fontWeight="$semibold"
                      color={selectedCategory === category.id
                        ? isDark ? '$textDark50' : '$textLight900'
                        : isDark ? '$textDark400' : '$textLight500'
                      }
                    >
                      {category.name}
                    </Text>
                  </Box>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>

          {/* Explore Cards */}
          {exploreCards.map(renderBrandCard)}
        </Box>
      </ScrollView>
    </Box>
  );
};