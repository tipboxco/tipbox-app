import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface BoostOptionCardProps {
  id: string;
  title: string;
  price: string;
  description: string;
  borderColor: string;
  iconBg: string;
  isPopular?: boolean;
  isSelected: boolean;
  onPress: () => void;
}

export const BoostOptionCard: React.FC<BoostOptionCardProps> = ({
  id,
  title,
  price,
  description,
  borderColor,
  iconBg,
  isPopular = false,
  isSelected,
  onPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
        borderWidth={1}
        borderColor={isSelected ? borderColor : '#E9E9E9'}
        borderRadius={5}
        position="relative"
      >
        <HStack px={12} py={18} alignItems="center" justifyContent="space-between">
          {/* Left Side: Icon and Content */}
          <HStack alignItems="center" space="sm" flex={1}>
            {/* Icon */}
            <Box
              width={36}
              height={36}
              bg={isSelected ? iconBg : (isDark ? '$backgroundDark700' : '#F5F5F5')}
              borderRadius={5}
              justifyContent="center"
              alignItems="center"
            >
              {isSelected ? (
                <Feather
                  name="zap"
                  size={18}
                  color="#FFFFFF"
                />
              ) : (
                <Feather
                  name="zap"
                  size={18}
                  color={isDark ? '#FFFFFF' : '#646464'}
                />
              )}
            </Box>

            {/* Content */}
            <VStack flex={1} space="xs">
              <Text
                color={isDark ? '$textDark50' : '#000000'}
                fontSize="$md"
                fontWeight="$semibold"
              >
                {title}
              </Text>
              <Text
                color={isDark ? '$textDark400' : '#000000'}
                fontSize="$sm"
                fontWeight="$normal"
              >
                {description}
              </Text>
            </VStack>
          </HStack>

          {/* Right Side: Amount */}
          <Box alignItems="center" justifyContent="center">
            <VStack alignItems="center" justifyContent="center" space="xs">
              {/* Popular Badge */}
              {isPopular && (
                <Box
                  bg="#829905"
                  borderWidth={1}
                  borderColor="#829905"
                  borderRadius={10}
                  px="$2"
                  py="$0.5"
                >
                  <Text
                    color="#FFFFFF"
                    fontSize="$xs"
                    fontWeight="$medium"
                  >
                    Popular
                  </Text>
                </Box>
              )}
              <Text
                color={isSelected ? '#829905' : (isDark ? '$textDark50' : '#000000')}
                fontSize="$md"
                fontWeight="$semibold"
              >
                {price}
              </Text>
            </VStack>
          </Box>
        </HStack>
      </Box>
    </Pressable>
  );
};

