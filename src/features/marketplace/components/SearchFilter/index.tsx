import React from 'react';
import { HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

export const SearchFilter = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack
      bg={isDark ? '$backgroundDark800' : '#F2F2F2'}
      borderRadius={20}
      px={14}
      py={6}
      alignItems="center"
      justifyContent="space-between"
    >
      <HStack alignItems="center" space="sm" flex={1}>
        <Feather 
          name="search" 
          size={20} 
          color={isDark ? '#FFFFFF' : '#8C8C8C'} 
        />
        <Text
          color={isDark ? '$textDark400' : '#B9B9B9'}
          fontSize={9}
          fontWeight="$medium"
          flex={1}
        >
          Ürün Grubu seçin veya ürün adı arayın
        </Text>
      </HStack>
      
      <Box w={0.5} h={20} bg={isDark ? '$backgroundDark200' : '#CDCDCD'} />
      
      <Pressable p={8}>
        <Feather 
          name="filter" 
          size={16} 
          color={isDark ? '#FFFFFF' : '#8C8C8C'} 
        />
      </Pressable>
    </HStack>
  );
};
