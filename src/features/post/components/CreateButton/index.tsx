import React from 'react';
import { Pressable, Box, Text } from '@gluestack-ui/themed';
import { PlusIcon } from 'react-native-heroicons/outline';
import { useBottomOffset } from '@/src/utils';

interface CreateButtonProps {
  onPress: () => void;
  /** Inventory status - only for PRODUCT level context */
  isProductInInventory?: boolean;
}

export const CreateButton = ({ onPress, isProductInInventory }: CreateButtonProps) => {
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 16 });

  return (
    <Pressable
      onPress={onPress}
      position="absolute"
      bottom={bottomOffset}
      right={16}
      zIndex={10}
    >
      <Box
        width={60}
        height={60}
        borderRadius={30}
        bg={isProductInInventory === false ? '#FFA500' : '#C2E607'}
        alignItems="center"
        justifyContent="center"
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.25}
        shadowRadius={3.84}
        elevation={5}
      >
        <PlusIcon width={24} height={24} color={isProductInInventory === false ? '#FFFFFF' : '#596B00'} />

        {/* Inventory indicator badge - only when product not in inventory */}
        {isProductInInventory === false && (
          <Box
            position="absolute"
            top={-4}
            right={-4}
            bg="#FF6B6B"
            borderRadius={12}
            width={24}
            height={24}
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor="#FFFFFF"
          >
            <Text fontSize={12} fontWeight="$bold" color="#FFFFFF">!</Text>
          </Box>
        )}
      </Box>
    </Pressable>
  );
};

