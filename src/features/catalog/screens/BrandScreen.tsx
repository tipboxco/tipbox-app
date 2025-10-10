import React, { useState } from 'react';
import { Box, Text, ScrollView, Pressable, HStack, VStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Search } from 'lucide-react-native';
import { mock_brand_detail } from '@/src/mock/catalog/brandCatalog';
import { BrandCard } from '../components/BrandCard';
import CategoryCard from '../components/CategoryCard';

type BrandScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'CatalogScreen'>;

interface BrandScreenProps {
  selectedCategory: any;
  onCategorySelect: (category: any) => void;
}

export const BrandScreen: React.FC<BrandScreenProps> = ({ selectedCategory, onCategorySelect }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<BrandScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState<'categories' | 'brands'>('categories');

  const handleCategoryPress = (category: any) => {
    setCurrentStep('brands');
    onCategorySelect(category);
  };

  const handleBrandPress = (brand: any) => {
    navigation.navigate('BrandDetailScreen', { brandId: brand.id });
  };

  const getCategoriesData = () => {
    // 12 adet category mock data
    return [
      { 
        id: '1', 
        name: 'Computers & Tablets', 
        icon: 'laptop',
        image: require('@/assets/inventory/product_01.png'),
        subCategories: []
      },
      { 
        id: '2', 
        name: 'Printers & Projectors', 
        icon: 'printer',
        image: require('@/assets/inventory/product_02.png'),
        subCategories: []
      },
      { 
        id: '3', 
        name: 'Phones & Phone Accessories', 
        icon: 'phone',
        image: require('@/assets/inventory/product_03.png'),
        subCategories: []
      },
      { 
        id: '4', 
        name: 'TV, Video & Audio Systems', 
        icon: 'tv',
        image: require('@/assets/inventory/product_04.png'),
        subCategories: []
      },
      { 
        id: '5', 
        name: 'Home Appliances', 
        icon: 'home',
        image: require('@/assets/inventory/product_05.png'),
        subCategories: []
      },
      { 
        id: '6', 
        name: 'Air Conditioners & Heaters', 
        icon: 'thermometer',
        image: require('@/assets/inventory/product_06.png'),
        subCategories: []
      },
      { 
        id: '7', 
        name: 'Small Home Appliances', 
        icon: 'coffee',
        image: require('@/assets/inventory/product_07.png'),
        subCategories: []
      },
      { 
        id: '8', 
        name: 'Cameras & Photography', 
        icon: 'camera',
        image: require('@/assets/inventory/product_08.png'),
        subCategories: []
      },
      { 
        id: '9', 
        name: 'Games & Game Consoles', 
        icon: 'gamepad',
        image: require('@/assets/inventory/product_09.png'),
        subCategories: []
      },
      { 
        id: '10', 
        name: 'Headphones & Speakers', 
        icon: 'headphones',
        image: require('@/assets/inventory/product_10.png'),
        subCategories: []
      },
      { 
        id: '11', 
        name: 'Smart Home Devices', 
        icon: 'smart-home',
        image: require('@/assets/inventory/product_11.png'),
        subCategories: []
      },
      { 
        id: '12', 
        name: 'Drones & Action Cameras', 
        icon: 'drone',
        image: require('@/assets/inventory/product_12.png'),
        subCategories: []
      },
    ];
  };

  const getBrandsData = () => {
    // 12 adet brand mock data
    return [
      { 
        id: '1', 
        name: 'Apple', 
        description: 'Technology company',
        followers: '120K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: false 
      },
      { 
        id: '2', 
        name: 'Samsung', 
        description: 'Electronics company',
        followers: '95K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: true 
      },
      { 
        id: '3', 
        name: 'Sony', 
        description: 'Entertainment company',
        followers: '80K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: false 
      },
      { 
        id: '4', 
        name: 'LG', 
        description: 'Electronics company',
        followers: '75K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: true 
      },
      { 
        id: '5', 
        name: 'Microsoft', 
        description: 'Software company',
        followers: '110K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: false 
      },
      { 
        id: '6', 
        name: 'Dell', 
        description: 'Computer company',
        followers: '65K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: true 
      },
      { 
        id: '7', 
        name: 'HP', 
        description: 'Technology company',
        followers: '70K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: false 
      },
      { 
        id: '8', 
        name: 'Canon', 
        description: 'Camera company',
        followers: '85K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: true 
      },
      { 
        id: '9', 
        name: 'Nikon', 
        description: 'Camera company',
        followers: '60K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: false 
      },
      { 
        id: '10', 
        name: 'Bose', 
        description: 'Audio company',
        followers: '55K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: true 
      },
      { 
        id: '11', 
        name: 'Philips', 
        description: 'Electronics company',
        followers: '90K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: false 
      },
      { 
        id: '12', 
        name: 'Dyson', 
        description: 'Vacuum company',
        followers: '100K Followers',
        logo: require('@/assets/avatar/ozan.png'),
        bannerImage: require('@/assets/events/banner.png'),
        isJoined: true 
      },
    ];
  };

  const getCurrentData = () => {
    if (currentStep === 'categories') {
      return getCategoriesData().filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return getBrandsData().filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  };

  const currentData = getCurrentData();

  return (
    <Box flex={1}>
      {/* Header Info */}
      <Box px="$4" py="$3">
        <VStack space="xs">
          <Text
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={14}
            fontWeight="$bold"
          >
            {currentStep === 'categories' ? 'Select Category' : 'Select Brand'}
          </Text>
          <Text
            color={isDark ? '#FFFFFF' : '#B9B9B9'}
            fontSize={9}
            fontWeight="$medium"
          >
            {currentStep === 'categories' 
              ? 'Choose a category to see available brands.'
              : `You will select a brand from the ${selectedCategory?.name || 'selected'} category.`
            }
          </Text>
        </VStack>
      </Box>

      {/* Arama Çubuğu */}
      <Box px="$4" py="$3">
        <Box
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderRadius={20}
          height={36}
          px="$4"
          justifyContent="center"
        >
          <HStack alignItems="center" space="sm">
            <Search size={24} color={isDark ? '#FFFFFF' : '#B9B9B9'} />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder={currentStep === 'categories' ? 'Category seçin veya arayın' : 'Brand seçin veya arayın'}
                placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={9}
              />
            </Input>
          </HStack>
        </Box>
      </Box>


      {/* Dynamic Grid */}
      <ScrollView flex={1} px="$4">
        <VStack space="md" pb="$20">
          {currentData.map((item, index) => (
            <HStack key={`row-${index}`} space="md" justifyContent="space-between">
              {[0, 1, 2].map((colIndex) => {
                const itemIndex = index * 3 + colIndex;
                const currentItem = currentData[itemIndex];
                
                if (!currentItem) {
                  return <Box key={`empty-${index}-${colIndex}`} flex={1} />;
                }
                
                if (currentStep === 'categories') {
                  return (
                    <CategoryCard
                      key={`category-${currentItem.id}-${index}-${colIndex}`}
                      category={currentItem as any}
                      onPress={() => handleCategoryPress(currentItem)}
                    />
                  );
                } else {
                  return (
                    <BrandCard
                      key={`brand-${currentItem.id}-${index}-${colIndex}`}
                      brand={currentItem as any}
                      onPress={() => handleBrandPress(currentItem)}
                    />
                  );
                }
              })}
            </HStack>
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
};
