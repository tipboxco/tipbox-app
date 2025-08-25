import React, { useCallback, useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Box, Text, VStack, ScrollView, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - (4 * CARD_MARGIN) - 32) / 3;

interface CategoryCardProps {
  image?: string;
  selected?: boolean;
  onPress?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
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
        height={CARD_WIDTH}
        bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
        borderRadius="$lg"
        mb="$2"
        mx="$1"
        borderWidth={2}
        borderColor={selected ? '#D8FF08' : 'transparent'}
        overflow="hidden"
      >
        {image ? (
          <Box
            width="100%"
            height="100%"
            bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
          />
        ) : (
          <Box
            width="100%"
            height="100%"
            alignItems="center"
            justifyContent="center"
            bg={isDark ? '$backgroundDark800' : '$backgroundLight200'}
          >
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              size="xl"
            >
              +
            </Text>
          </Box>
        )}
      </Box>
    </Pressable>
  );
};

interface CategoryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
}

export const CategoryBottomSheet = React.forwardRef<
  BottomSheet,
  CategoryBottomSheetProps
>(({ visible, onClose, onSelect }, ref) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Variables
  const snapPoints = useMemo(() => ['80%', "100%"], []);

  // Callbacks
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);


  if (!visible) return null;

  return (
    <Portal>
      <BottomSheet
        ref={ref}
        topInset={0}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        enableOverDrag={true}
        backgroundComponent={({ style }) => (
          <Box bg={isDark ? '#0F172A' : '#F9FAFB'} />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#666666' : '#CCCCCC',
        }}
      >
        <BottomSheetView style={{ flex: 1, height: "100%", paddingHorizontal: 16 }}>
          <Text
            fontSize="$lg"
            fontWeight="$bold"
            textAlign="center"
            mb="$4"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Ana Kategori
          </Text>
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Box flexDirection="row" flexWrap="wrap" justifyContent="flex-start">
              {Array.from({ length: 15 }).map((_, index) => (
                <CategoryCard
                  key={index}
                  selected={selectedCategory === `category-${index}`}
                  onPress={() => {
                    setSelectedCategory(`category-${index}`);
                    onSelect(`category-${index}`);
                  }}
                />
              ))}
            </Box>
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
});