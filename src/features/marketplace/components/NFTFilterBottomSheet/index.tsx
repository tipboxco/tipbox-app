import React from 'react';
import { Box, VStack, Text, Pressable, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Check } from 'lucide-react-native';
import type { NFTType } from '../SearchFilter';

interface NFTFilterBottomSheetProps {
  selectedType: NFTType;
  onTypeSelect: (type: NFTType) => void;
  onClose: () => void;
}

export const NFTFilterBottomSheet: React.FC<NFTFilterBottomSheetProps> = ({
  selectedType,
  onTypeSelect,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const nftTypes: { value: NFTType; label: string; description: string }[] = [
    { value: 'ALL', label: 'All Types', description: 'Show all NFT types' },
    { value: 'BADGE', label: 'Badge', description: 'Achievement and status badges' },
    { value: 'COSMETIC', label: 'Cosmetic', description: 'Visual customization items' },
    { value: 'LOOTBOX', label: 'Lootbox', description: 'Mystery boxes with random items' },
  ];

  const handleTypeSelect = (type: NFTType) => {
    onTypeSelect(type);
    onClose();
  };

  return (
    <Box
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      borderTopLeftRadius={24}
      borderTopRightRadius={24}
      pt="$4"
      pb="$6"
      px="$4"
    >
      <VStack space="md">
        {/* Header */}
        <VStack space="xs" pb="$2" borderBottomWidth={1} borderColor={isDark ? '$borderDark100' : '$borderLight200'}>
          <Text
            fontSize="$lg"
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
            textAlign="center"
          >
            Filter by NFT Type
          </Text>
          <Text
            fontSize="$xs"
            color={isDark ? '$textDark400' : '$textLight500'}
            textAlign="center"
          >
            Select the type of NFT you want to see
          </Text>
        </VStack>

        {/* NFT Type Options */}
        <VStack space="sm">
          {nftTypes.map((type) => {
            const isSelected = selectedType === type.value;

            return (
              <Pressable
                key={type.value}
                onPress={() => handleTypeSelect(type.value)}
                bg={isSelected ? (isDark ? '$backgroundDark100' : '$backgroundLight100') : 'transparent'}
                borderWidth={1}
                borderColor={isSelected ? '$buttonPrimary' : (isDark ? '$borderDark100' : '$borderLight200')}
                borderRadius={12}
                p="$4"
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <VStack flex={1} space="xs">
                    <Text
                      fontSize="$md"
                      fontWeight={isSelected ? '$bold' : '$normal'}
                      color={isSelected ? '$buttonPrimary' : (isDark ? '$textDark50' : '$textLight900')}
                    >
                      {type.label}
                    </Text>
                    <Text
                      fontSize="$xs"
                      color={isDark ? '$textDark400' : '$textLight500'}
                    >
                      {type.description}
                    </Text>
                  </VStack>

                  {isSelected && (
                    <Box
                      bg="$buttonPrimary"
                      borderRadius="$full"
                      p="$1"
                      ml="$2"
                    >
                      <Check size={16} color="#000000" />
                    </Box>
                  )}
                </HStack>
              </Pressable>
            );
          })}
        </VStack>
      </VStack>
    </Box>
  );
};
