import React from 'react';
import { Box, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface HeaderProps {
  title: string;
  hasNotification?: boolean;
  hasMessage?: boolean;
  onMenuPress?: () => void;
}

export const Header = ({ 
  title, 
  hasNotification = false, 
  hasMessage = false,
  onMenuPress 
}: HeaderProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      px="$4"
      py="$2"
      borderBottomWidth={1}
      borderBottomColor={isDark ? '$backgroundDark100' : '$backgroundLight200'}
      h={98}
    >
      <Box mt="$6">
        <HStack space="md" alignItems="center" justifyContent="space-between">
          <Pressable onPress={onMenuPress}>
            <Feather name="menu" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$xl"
            fontWeight="$bold"
          >
            {title}
          </Text>
          <HStack space="lg" alignItems="center">
            <Pressable>
              <Box position="relative">
                <Feather name="bell" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
                {hasNotification && (
                  <Box
                    position="absolute"
                    top={1}
                    right={1}
                    w={8}
                    h={8}
                    rounded="$full"
                    bg="$tertiary400"
                  />
                )}
              </Box>
            </Pressable>
            <Pressable>
              <Box position="relative">
                <Feather name="message-circle" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                {hasMessage && (
                  <Box
                    position="absolute"
                    top={1}
                    right={1}
                    w={8}
                    h={8}
                    rounded="$full"
                    bg="$tertiary400"
                  />
                )}
              </Box>
            </Pressable>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};