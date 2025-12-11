import React from 'react';
import { Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useBottomOffset } from '@/src/utils';

interface FloatingActionButtonProps {
  onPress?: () => void;
}

export const FloatingActionButton = ({ onPress }: FloatingActionButtonProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 20 });

  return (
    <Pressable
      position="absolute"
      bottom={bottomOffset}
      right={20}
      width={60}
      height={60}
      borderRadius={30}
      bg="#C2E607"
      borderWidth={1}
      borderColor="#97B306"
      justifyContent="center"
      alignItems="center"
      shadowColor="#000000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.25}
      shadowRadius={4}
      elevation={5}
      onPress={onPress}
    >
      <Feather 
        name="plus" 
        size={24} 
        color="#596B00" 
      />
    </Pressable>
  );
};
