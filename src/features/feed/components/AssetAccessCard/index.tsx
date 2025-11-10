import React from 'react';
import { Box, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AssetAccessCardProps {
  onTabChange: (tab: 'wallet' | 'inventory') => void;
}

export const AssetAccessCard = ({ onTabChange }: AssetAccessCardProps) => {
  const handleTabPress = (tab: 'wallet' | 'inventory') => {
    onTabChange(tab);
  };

  return (
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
  );
};

