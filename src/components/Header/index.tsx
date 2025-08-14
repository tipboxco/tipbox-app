import React from 'react';
import { Box, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface HeaderProps {
  title: string;
  hasNotification?: boolean;
  hasMessage?: boolean;
  onMenuPress?: () => void;
  showBackButton?: boolean;
}

export const Header = ({ 
  title, 
  hasNotification = false, 
  hasMessage = false,
  onMenuPress,
  showBackButton = false
}: HeaderProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      px="$4"
      borderBottomWidth={1}
      borderBottomColor={isDark ? '$backgroundDark100' : '$backgroundLight200'}
      justifyContent="center"
    >
      <Box my="$2">
        <HStack space="md" alignItems="center" justifyContent="space-between">
          <Pressable onPress={onMenuPress}>
            <Feather 
              name={showBackButton ? "arrow-left" : "menu"} 
              size={22} 
              color={isDark ? '#FFFFFF' : '#000000'} 
            />
          </Pressable>
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$lg"
            fontWeight="$bold"
          >
            {title}
          </Text>
          <HStack space="lg" alignItems="center">
            <Pressable>
              <Box position="relative">
                <Feather name="bell" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                {hasNotification && (
                  <Box
                    position="absolute"
                    top={1}
                    right={1}
                    w={6}
                    h={6}
                    rounded="$full"
                    bg="$tertiary400"
                  />
                )}
              </Box>
            </Pressable>
            <Pressable>
              <Box position="relative">
                <Feather name="message-circle" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                {hasMessage && (
                  <Box
                    position="absolute"
                    top={1}
                    right={1}
                    w={6}
                    h={6}
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