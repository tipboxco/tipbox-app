import React, { useState } from 'react';
import { Box, HStack, Text, Pressable, VStack } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showTabs?: boolean;
  onTabChange?: (tab: 'wallet' | 'inventory') => void;
  rightAction?: React.ReactNode;
}

export const Header = ({
  title,
  onMenuPress,
  onNotificationPress,
  onMessagePress,
  showBackButton = false,
  onBackPress,
  showTabs = false,
  onTabChange,
  rightAction
}: HeaderProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handleTabPress = (tab: 'wallet' | 'inventory') => {
    onTabChange?.(tab);
  };

  return (
    <VStack>
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
              textAlign="center"
            >
              {title}
            </Text>
            {rightAction ? (
              <Box width={24} height={24} alignItems="center" justifyContent="center">
                {rightAction}
              </Box>
            ) : (
              <Box width={24} />
            )}
          </HStack>
        </Box>
      </Box>

      {/* Tabs Section */}
      {showTabs && (
        <Box px="$4" py="$2">
          <HStack space="sm" alignItems="center">
            {/* Wallet Tab */}
            <Pressable
              flex={1}
              onPress={() => handleTabPress('wallet')}
            >
              <Box
                borderRadius={5}
                height={48}
                position="relative"
                overflow="hidden"
              >
                <LinearGradient
                  colors={['#6B7F00', '#4A5A00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 1
                  }}
                />
                <HStack 
                  alignItems="center" 
                  space="xs" 
                  px="$3" 
                  py="$2"
                  height="100%"
                  justifyContent="flex-start"
                >
                  <Feather
                    name="credit-card"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text
                    color="#FFFFFF"
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    Wallet
                  </Text>
                </HStack>
              </Box>
            </Pressable>

            {/* Inventory Tab */}
            <Pressable
              flex={1}
              onPress={() => handleTabPress('inventory')}
            >
              <Box
                borderRadius={5}
                height={48}
                position="relative"
                overflow="hidden"
              >
                <LinearGradient
                  colors={['#8B5CF6', '#5B21B6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 1
                  }}
                />
                <HStack 
                  alignItems="center" 
                  space="xs" 
                  px="$3" 
                  py="$2"
                  height="100%"
                  justifyContent="flex-start"
                >
                  <Feather
                    name="package"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text
                    color="#FFFFFF"
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    Inventory
                  </Text>
                </HStack>
              </Box>
            </Pressable>
          </HStack>
        </Box>
      )}
    </VStack>
  );
};