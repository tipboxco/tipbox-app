import React, { useState } from 'react';
import { Box, VStack, Text, Pressable, HStack, Button, ButtonText } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
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
  const { t } = useTranslation('marketplace');

  // Local state for temporary selection (applied on Done)
  const [tempSelectedType, setTempSelectedType] = useState<NFTType>(selectedType);

  const nftTypes: { value: NFTType; label: string }[] = [
    { value: 'ALL', label: t('screens.marketplace.filter.types.all') },
    { value: 'BADGE', label: t('screens.marketplace.filter.types.badge') },
    { value: 'COSMETIC', label: t('screens.marketplace.filter.types.cosmetic') },
  ];

  const handleReset = () => {
    setTempSelectedType('ALL');
  };

  const handleDone = () => {
    onTypeSelect(tempSelectedType);
    onClose();
  };

  return (
    <Box
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      borderTopLeftRadius={24}
      borderTopRightRadius={24}
      pt="$4"
      pb="$6"
      px="$5"
    >
      <VStack space="lg">
        {/* Header */}
        <Text
          fontSize="$xl"
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '$textLight900'}
          textAlign="center"
        >
          {t('screens.marketplace.filter.title')}
        </Text>

        {/* Filter Options */}
        <VStack space="xs">
          {nftTypes.map((type) => {
            const isSelected = tempSelectedType === type.value;

            return (
              <Pressable
                key={type.value}
                onPress={() => setTempSelectedType(type.value)}
                py="$3"
              >
                <HStack alignItems="center" space="md">
                  {/* Radio Button */}
                  <Box
                    width={24}
                    height={24}
                    borderRadius="$full"
                    borderWidth={2}
                    borderColor={isSelected ? '#000000' : (isDark ? '$borderDark300' : '$borderLight400')}
                    alignItems="center"
                    justifyContent="center"
                    bg={isSelected ? 'transparent' : 'transparent'}
                  >
                    {isSelected && (
                      <Box
                        width={12}
                        height={12}
                        borderRadius="$full"
                        bg="#000000"
                      />
                    )}
                  </Box>

                  {/* Label */}
                  <Text
                    fontSize="$md"
                    color={isDark ? '$textDark50' : '$textLight900'}
                    fontWeight={isSelected ? '$semibold' : '$normal'}
                  >
                    {type.label}
                  </Text>
                </HStack>
              </Pressable>
            );
          })}
        </VStack>

        {/* Action Buttons */}
        <HStack space="md" mt="$4">
          <Button
            flex={1}
            variant="outline"
            borderColor={isDark ? '$borderDark300' : '$borderLight300'}
            bg="transparent"
            onPress={handleReset}
            borderRadius={12}
            py="$3"
          >
            <ButtonText
              color={isDark ? '$textDark300' : '$textLight600'}
              fontSize="$md"
              fontWeight="$semibold"
            >
              {t('screens.marketplace.filter.reset')}
            </ButtonText>
          </Button>

          <Button
            flex={1}
            bg="$buttonPrimary"
            onPress={handleDone}
            borderRadius={12}
            py="$3"
          >
            <ButtonText
              color="#000000"
              fontSize="$md"
              fontWeight="$semibold"
            >
              {t('screens.marketplace.filter.done')}
            </ButtonText>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
