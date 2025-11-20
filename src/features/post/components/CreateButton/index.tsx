import React from 'react';
import { Platform } from 'react-native';
import { Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';

interface CreateButtonProps {
  onPress: () => void;
}

export const CreateButton = ({ onPress }: CreateButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      position="absolute"
      bottom={Platform.OS === 'ios' ? 8 : 8}
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
        <Feather name="plus" size={24} color="#596B00" />
      </Box>
    </Pressable>
  );
};

