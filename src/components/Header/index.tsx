import React from 'react';
import { Box, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface HeaderProps {
  title: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const Header = ({
  title,
  onMenuPress,
  onNotificationPress,
  onMessagePress,
  showBackButton = false,
  onBackPress
}: HeaderProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      px="$4"
      justifyContent="center"
    >
      <Box my="$2">
        <HStack space="md" alignItems="center">
          <Pressable flex={1} onPress={showBackButton ? onBackPress : onMenuPress}>
            <Feather
              name={showBackButton ? "arrow-left" : "menu"}
              size={22}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Pressable>
          <Text
            flex={1}
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize="$lg"
            fontWeight="$bold"
          >
            {title}
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};