import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, ScrollView, HStack, Pressable, Spinner } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '@/src/store/appStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import categories from '@/src/mock/auth/categorys';
import type { Category, SubCategory } from '@/src/mock/auth/categorys';
import { useUpdateUserInterests } from '../api/hooks';
import { Alert } from 'react-native';

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
  const { completeRegistration } = useAppStore();
  const updateInterestsMutation = useUpdateUserInterests();
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);

  const handleSelectSubCategory = (subCategoryId: string) => {
    setSelectedSubCategories((prev) => {
      if (prev.includes(subCategoryId)) {
        return prev.filter(id => id !== subCategoryId);
      }
      return [...prev, subCategoryId];
    });
  };

  const handleNext = async () => {
    if (selectedSubCategories.length > 0) {
      try {
        // API'ye seçilen kategorileri gönder
        await updateInterestsMutation.mutateAsync(selectedSubCategories);
        
        // Başarılı olursa kullanıcıyı giriş yapmış olarak işaretle
        completeRegistration();
        
        // Kullanıcıyı giriş yapmış olarak işaretle
        // completeRegistration() çağrıldığında RootNavigator otomatik olarak
        // isAuthenticated kontrolü yapacak ve MainDrawer'ı render edecek
        // Auth stack'ten çıkmak için navigation'ı sıfırlamaya gerek yok,
        // çünkü RootNavigator zaten conditional rendering yapıyor
        completeRegistration();
        
        // Not: RootNavigator otomatik olarak MainDrawer'a geçecek
        // Navigation reset gerekmez çünkü RootNavigator seviyesinde
        // isAuthenticated değişikliği otomatik olarak yeni stack'i render eder
      } catch (error: any) {
        // Hata durumunda kullanıcıya bilgi ver
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred while saving categories.';
        Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
        console.error('[SelectCategoriesScreen] Update interests error:', error);
      }
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
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
          Select Your Interests
        </Text>
        
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="center"
          mb="$4"
        >
          Select at least one category so we can provide you with personalized content
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
          opacity={selectedSubCategories.length > 0 && !updateInterestsMutation.isPending ? 1 : 0.5}
          disabled={selectedSubCategories.length === 0 || updateInterestsMutation.isPending}
        >
          {updateInterestsMutation.isPending ? (
            <Spinner size="small" color="$textLight900" />
          ) : (
            <ButtonText color="$textLight900">
              {`Continue (${selectedSubCategories.length} selected)`}
            </ButtonText>
          )}
        </Button>
      </VStack>
      </Box>
    </SafeAreaView>
  );
};
