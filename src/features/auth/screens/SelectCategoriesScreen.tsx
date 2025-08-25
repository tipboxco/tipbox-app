import React, { useState } from 'react';
import { Box, Text, Button, ButtonText, VStack, ScrollView, HStack, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/src/store/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import categories from '@/src/mock/auth/categorys';
import type { Category, SubCategory } from '@/src/mock/auth/categorys';

type SelectCategoriesScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SelectCategories'>;

interface CategoryItemProps {
  category: Category;
  selectedSubCategories: string[];
  onSelectSubCategory: (subCategoryId: string) => void;
  isDark: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  selectedSubCategories,
  onSelectSubCategory,
  isDark,
}) => {
  return (
    <VStack space="sm" mb="$4">
      <Text
        fontSize="$lg"
        fontWeight="$bold"
        color={isDark ? '$textDark50' : '$textLight900'}
      >
        {category.name}
      </Text>
      <HStack flexWrap="wrap" space="sm">
        {category.subCategories.map((subCategory) => (
          <Pressable
            key={subCategory.id}
            onPress={() => onSelectSubCategory(subCategory.id)}
            bg={selectedSubCategories.includes(subCategory.id) ? '$yellow400' : isDark ? '$backgroundDark100' : '$backgroundLight100'}
            px="$3"
            py="$2"
            rounded="$full"
            mb="$2"
          >
            <Text
              color={selectedSubCategories.includes(subCategory.id) ? '$textLight900' : isDark ? '$textDark50' : '$textLight900'}
              fontSize="$sm"
            >
              {subCategory.name}
            </Text>
          </Pressable>
        ))}
      </HStack>
    </VStack>
  );
};

export const SelectCategoriesScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SelectCategoriesScreenNavigationProp>();
  const { completeRegistration } = useAuthStore();
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);

  const handleSelectSubCategory = (subCategoryId: string) => {
    setSelectedSubCategories((prev) => {
      if (prev.includes(subCategoryId)) {
        return prev.filter(id => id !== subCategoryId);
      }
      return [...prev, subCategoryId];
    });
  };

  const handleNext = () => {
    if (selectedSubCategories.length > 0) {
      console.log('Selected categories:', selectedSubCategories);
      // TODO: API entegrasyonu yapılacak
      
      // Kullanıcıyı giriş yapmış olarak işaretle
      completeRegistration();
      
      // Ana ekrana yönlendir
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'Main' as never,
          params: {
            screen: 'Feed'
          }
        }],
      });
    }
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      p="$4"
    >
      <VStack flex={1} space="md">
        <Text
          fontSize="$2xl"
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '$textLight900'}
          textAlign="center"
        >
          İlgi Alanlarınızı Seçin
        </Text>
        
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mb="$4"
        >
          Size özel içerikler sunabilmemiz için en az bir kategori seçin
        </Text>

        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          {categories?.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              selectedSubCategories={selectedSubCategories}
              onSelectSubCategory={handleSelectSubCategory}
              isDark={isDark}
            />
          ))}
        </ScrollView>

        <Button
          bg="$yellow400"
          py="$1"
          rounded="$lg"
          mt="$4"
          onPress={handleNext}
          opacity={selectedSubCategories.length > 0 ? 1 : 0.5}
          disabled={selectedSubCategories.length === 0}
        >
          <ButtonText color="$textLight900">
            {`Devam Et (${selectedSubCategories.length} seçili)`}
          </ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};
