import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { Box, Text, Pressable, Image, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { categories, MainCategory, SubCategory, ProductGroup, Product } from '@/src/mock/inventory/AllCategories';
import { ChevronLeft } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - (4 * CARD_MARGIN) - 32) / 2;

interface CategoryCardProps {
  title: string;
  image?: string;
  selected?: boolean;
  onPress?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  image,
  selected,
  onPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        width={CARD_WIDTH}
        height={CARD_WIDTH * 1.15} // Resim + başlık için yükseklik
        bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
        borderRadius="$lg"
        mb="$2"
        mx="$1"
        borderWidth={2}
        borderColor={selected ? '#D8FF08' : 'transparent'}
        overflow="hidden"
      >
        <Box>
          <Image
            source={{ uri: image }}
            alt={title}
            width={CARD_WIDTH}
            height={CARD_WIDTH * 0.75}
            resizeMode="cover"
          />
        </Box>
        <Box p="$2" flex={1} justifyContent="center">
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            size="xs"
            numberOfLines={2}
            textAlign="center"
            lineHeight={16}
          >
            {title}
          </Text>
        </Box>
      </Box>
    </Pressable>
  );
};

interface CategoryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: Product, selection: SelectionState) => void;
}

type SelectionState = {
  mainCategory?: MainCategory;
  subCategory?: SubCategory;
  productGroup?: ProductGroup;
  product?: Product;
};

export const CategoryBottomSheet = React.forwardRef<
  BottomSheet,
  CategoryBottomSheetProps
>(({ visible, onClose, onSelect }, ref) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selection, setSelection] = useState<SelectionState>({});

  // Variables
  const snapPoints = useMemo(() => ['85%'], []);
  const initialSnapPoint = 0; // İlk snap point'i belirtiyoruz

  // Callbacks
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Reset selection when sheet becomes visible
  React.useEffect(() => {
    if (visible) {
      setSelection({});
    }
  }, [visible]);

  const handleBack = () => {
    if (selection.product) {
      setSelection({ ...selection, product: undefined });
    } else if (selection.productGroup) {
      setSelection({ ...selection, productGroup: undefined });
    } else if (selection.subCategory) {
      setSelection({ ...selection, subCategory: undefined });
    } else {
      setSelection({});
    }
  };

  const getTitle = () => {
    if (selection.product) return selection.productGroup?.name || '';
    if (selection.productGroup) return selection.subCategory?.name || '';
    if (selection.subCategory) return selection.mainCategory?.name || '';
    return 'Ana Kategori';
  };

  const renderContent = () => {
    if (selection.product) {
      // Bu durumda zaten seçim yapılmış demektir
      return null;
    }

    if (selection.productGroup) {
      return selection.productGroup.products.map((product) => (
        <CategoryCard
          key={product.id}
          title={product.name}
          image={product.image}
          selected={selection.product?.id === product.id}
          onPress={() => {
            setSelection({ ...selection, product });
            onSelect(product, selection);
            onClose();
          }}
        />
      ));
    }

    if (selection.subCategory) {
      return selection.subCategory.productGroups.map((group) => (
        <CategoryCard
          key={group.id}
          title={group.name}
          image={group.image}
          selected={selection.productGroup?.id === group.id}
          onPress={() => setSelection({ ...selection, productGroup: group })}
        />
      ));
    }

    if (selection.mainCategory) {
      return selection.mainCategory.subCategories.map((subCategory) => (
        <CategoryCard
          key={subCategory.id}
          title={subCategory.name}
          image={subCategory.image}
          selected={selection.subCategory?.id === subCategory.id}
          onPress={() => setSelection({ ...selection, subCategory })}
        />
      ));
    }

    return categories.map((category) => (
      <CategoryCard
        key={category.id}
        title={category.name}
        image={category.image}
        selected={selection.mainCategory?.id === category.id}
        onPress={() => setSelection({ mainCategory: category })}
      />
    ));
  };

  if (!visible) return null;

  return (
    <Portal>
      <BottomSheet
        ref={ref}
        topInset={0}
        index={initialSnapPoint}
        animateOnMount={true}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        enableOverDrag={false}
        enableContentPanningGesture={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.7}
            style={[props.style, { backgroundColor: isDark ? '#0B1020' : '#FFFFFF' }]}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#666666' : '#CCCCCC',
        }}
      >
        <BottomSheetView style={{ flex: 1, height: "100%", paddingHorizontal: 16 }}>
          <HStack alignItems="center" mb="$4">
            {(selection.mainCategory) && (
              <Pressable onPress={handleBack} mr="$2">
                <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
              </Pressable>
            )}
            <Text
              flex={1}
              fontSize="$lg"
              fontWeight="$bold"
              textAlign="center"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              {getTitle()}
            </Text>
          </HStack>
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Box flexDirection="row" flexWrap="wrap" justifyContent="flex-start">
              {renderContent()}
            </Box>
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
});