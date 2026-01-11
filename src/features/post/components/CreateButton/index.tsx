import React from 'react';
import { Pressable, Box } from '@gluestack-ui/themed';
import { PlusIcon } from 'react-native-heroicons/outline';
import { useBottomOffset } from '@/src/utils';

interface CreateButtonProps {
  onPress: () => void;
}

export const CreateButton = ({ onPress }: CreateButtonProps) => {
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
        bg="#C2E607"
        alignItems="center"
        justifyContent="center"
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.25}
        shadowRadius={3.84}
        elevation={5}
      >
        <PlusIcon width={24} height={24} color="#596B00" />
      </Box>
    </Pressable>
  );
};

