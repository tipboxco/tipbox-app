import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, ScrollView, HStack, Pressable, Spinner } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { useUserCategories } from '../api/hooks';
import type { UserCategory } from '../api/authApi';
import { Alert } from 'react-native';
import { useAppStore } from '@/src/store/appStore';

type SelectCategoriesScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SelectCategories'>;

interface SubCategoryChipProps {
  subCategoryId: string;
  name: string;
  isSelected: boolean;
  isDark: boolean;
  onSelectSubCategory: (subCategoryId: string) => void;
}

const SubCategoryChip = React.memo<SubCategoryChipProps>(({ subCategoryId, name, isSelected, isDark, onSelectSubCategory }) => (
  <Box
    style={{
      width: '48%',
      marginHorizontal: '1%',
      marginBottom: 8,
    }}
  >
    <Pressable
      onPress={() => onSelectSubCategory(subCategoryId)}
      bg={isSelected ? '$buttonPrimary' : isDark ? '$backgroundDark100' : '$backgroundLight100'}
      borderWidth={1}
      borderColor={isSelected ? '$buttonPrimary' : isDark ? '$borderDark100' : '$borderLight100'}
      px="$3"
      py="$2.5"
      rounded="$lg"
      w="$full"
    >
      <Text
        color={isSelected ? '$textLight900' : isDark ? '$textDark50' : '$textLight900'}
        fontSize="$sm"
        fontWeight={isSelected ? '$medium' : '$normal'}
        textAlign="center"
        numberOfLines={2}
      >
        {name}
      </Text>
    </Pressable>
  </Box>
));

SubCategoryChip.displayName = 'SubCategoryChip';

interface CategoryItemProps {
  category: UserCategory;
  selectedSubCategories: string[];
  onSelectSubCategory: (subCategoryId: string) => void;
  isDark: boolean;
}

const CategoryItemInner: React.FC<CategoryItemProps> = ({
  category,
  selectedSubCategories,
  onSelectSubCategory,
  isDark,
}) => {
  return (
    <VStack space="sm" mb="$6">
      <Text
        fontSize="$lg"
        fontWeight="$bold"
        color={isDark ? '$textDark50' : '$textLight900'}
        mb="$2"
      >
        {category.name}
      </Text>
      <Box
        flexDirection="row"
        flexWrap="wrap"
        style={{ marginHorizontal: -4 }}
      >
        {category.subCategories.map((subCategory) => (
          <SubCategoryChip
            key={subCategory.subCategoryId}
            subCategoryId={subCategory.subCategoryId}
            name={subCategory.name}
            isSelected={selectedSubCategories.includes(subCategory.subCategoryId)}
            isDark={isDark}
            onSelectSubCategory={onSelectSubCategory}
          />
        ))}
      </Box>
    </VStack>
  );
};

export const CategoryItem = React.memo(CategoryItemInner);

export const SelectCategoriesScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SelectCategoriesScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const setSelectedCategories = useAppStore((state) => state.setSelectedCategories);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  
  // API'den kategorileri getir
  const { data: categories, isLoading, error } = useUserCategories();

  // Edge-to-Edge Design: Top ve bottom insets için theme-aware background
  const backgroundColor = isDark ? '#1F2937' : '#FFFFFF';

  const handleSelectSubCategory = useCallback((subCategoryId: string) => {
    setSelectedSubCategories((prev) => {
      if (prev.includes(subCategoryId)) {
        return prev.filter(id => id !== subCategoryId);
      }
      return [...prev, subCategoryId];
    });
  }, []);

  const handleNext = useCallback(() => {
    const MIN_SELECTED = 3;
    if (!categories) {
      Alert.alert('Error', 'Categories not loaded. Please try again.');
      return;
    }
    
    if (selectedSubCategories.length >= MIN_SELECTED) {
      // Seçilen subCategory'leri categoryId'lerine göre grupla
      const categoriesMap = new Map<string, string[]>();
      
      categories.forEach((category) => {
        category.subCategories.forEach((subCategory) => {
          if (selectedSubCategories.includes(subCategory.subCategoryId)) {
            const existing = categoriesMap.get(category.categoryId) || [];
            categoriesMap.set(category.categoryId, [...existing, subCategory.subCategoryId]);
          }
        });
      });

      // Backend formatına çevir
      const formattedCategories = Array.from(categoriesMap.entries()).map(([categoryId, subCategoryIds]) => ({
        categoryId,
        subCategoryIds,
      }));

      // Global state'e kaydet (route params yerine)
      setSelectedCategories(formattedCategories);

      // SetupProfile ekranına yönlendir (params olmadan)
      navigation.navigate('SetupProfile');
    } else {
      Alert.alert('Error', `Please select at least ${MIN_SELECTED} categories`);
    }
  }, [categories, selectedSubCategories, setSelectedCategories, navigation]);

  // Minimum 3 kategori seçilmesi gerekiyor (görseldeki tasarıma göre)
  const MIN_SELECTED = 3;
  const selectedCount = selectedSubCategories.length;
  const isNextEnabled = selectedCount >= MIN_SELECTED;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'bottom']}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      >
        {/* Header */}
        <Box px="$4" pt="$4" pb="$2">
          <Text
            fontSize="$2xl"
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Set Up Profile
          </Text>
          
          <Text
            fontSize="$sm"
            color={isDark ? '$textDark300' : '$textLight600'}
            mt="$2"
            mb="$4"
          >
            Select your interests to personalize your experience
          </Text>
        </Box>

        {/* Content */}
        <ScrollView 
          flex={1} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        >
          {isLoading ? (
            <Box flex={1} alignItems="center" justifyContent="center" py="$20">
              <Spinner size="large" color={isDark ? '$textDark300' : '$textLight600'} />
              <Text
                fontSize="$sm"
                color={isDark ? '$textDark300' : '$textLight600'}
                mt="$4"
              >
                Loading categories...
              </Text>
            </Box>
          ) : error ? (
            <Box flex={1} alignItems="center" justifyContent="center" py="$20" px="$4">
              <Text
                fontSize="$md"
                color="$error500"
                textAlign="center"
                mb="$4"
              >
                Failed to load categories
              </Text>
              <Text
                fontSize="$sm"
                color={isDark ? '$textDark300' : '$textLight600'}
                textAlign="center"
              >
                {error instanceof Error ? error.message : 'An error occurred'}
              </Text>
            </Box>
          ) : categories && categories.length > 0 ? (
            categories.map((category) => (
              <CategoryItem
                key={category.categoryId}
                category={category}
                selectedSubCategories={selectedSubCategories}
                onSelectSubCategory={handleSelectSubCategory}
                isDark={isDark}
              />
            ))
          ) : (
            <Box flex={1} alignItems="center" justifyContent="center" py="$20">
              <Text
                fontSize="$sm"
                color={isDark ? '$textDark300' : '$textLight600'}
                textAlign="center"
              >
                No categories available
              </Text>
            </Box>
          )}
        </ScrollView>

        {/* Sticky Footer */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="#000000"
          borderTopWidth={1}
          borderTopColor="#333333"
          px="$4"
          py="$4"
          pb="$0"
        >
          <HStack alignItems="center" justifyContent="space-between">
            <VStack space="xs">
              <Text
                fontSize="$sm"
                fontWeight="$medium"
                color="$white"
              >
                {selectedCount}/{MIN_SELECTED} Selected
              </Text>
              {selectedCount < MIN_SELECTED && (
                <Text
                  fontSize="$xs"
                  color="#CCCCCC"
                >
                  Select at least {MIN_SELECTED} categories to continue
                </Text>
              )}
            </VStack>
            
            <Button
              bg="$buttonPrimary"
              px="$6"
              py="$3"
              rounded="$lg"
              onPress={handleNext}
              opacity={isNextEnabled ? 1 : 0.5}
              disabled={!isNextEnabled}
            >
              <ButtonText color="$textLight900" fontWeight="$bold" fontSize="$md">
                Next
              </ButtonText>
            </Button>
          </HStack>
        </Box>
      </Box>
    </SafeAreaView>
  );
};
