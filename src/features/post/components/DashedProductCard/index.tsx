import React from 'react';
import { Box, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface DashedProductCardProps {
  onPress?: () => void;
}

export const DashedProductCard: React.FC<DashedProductCardProps> = ({
  onPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable
      onPress={onPress}
      flex={1}
      mx={4}
    >
      <Box
        bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
        borderWidth={1}
        borderColor="#9E9E9E"
        borderStyle="dashed"
        borderRadius={10}
        minHeight={200}
      >
        <VStack justifyContent="space-between" flex={1}>
          {/* Top Section - Plus Icon and Add Product in a Box */}
          <Box alignItems="center" justifyContent="center" flex={1}>
            <VStack alignItems="center" space="xs">
              <Feather
                name="plus"
                size={36}
                color={isDark ? '#C1BEBF' : '#C1BEBF'}
              />
              <Text
                color={isDark ? '$textDark400' : '#A3A3A3'}
                fontSize={12}
                fontWeight="$semibold"
              >
                Add Product
              </Text>
            </VStack>
          </Box>
          
          {/* Bottom Section - Info Icon and Inventory or Catalog in a Box */}
          <Box backgroundColor='#F5F5F5' borderBottomLeftRadius={10} borderBottomRightRadius={10} p='$3' py='$2'>
            <HStack alignItems="center" space="xs">
              <Feather
                name="info"
                size={14}
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
              />
              <Text
                color={isDark ? '$textDark400' : '#8C8C8C'}
                fontSize={9}
                fontWeight="$semibold"
              >
                Inventory or Catalog
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Box>
    </Pressable>
  );
};

