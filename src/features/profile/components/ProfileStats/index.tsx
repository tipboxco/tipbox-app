import React from 'react';
import { Box, HStack, Text, VStack, Divider } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface StatItemProps {
  value: string;
  label: string;
  isDark: boolean;
}

const StatItem = ({ value, label, isDark }: StatItemProps) => (
  <VStack alignItems="center" space="xs">
    <Text
      fontSize="$lg"
      fontWeight="$bold"
      color={isDark ? '$textDark50' : '$textLight900'}
    >
      {value}
    </Text>
    <Text
      fontSize="$sm"
      color={isDark ? '$textDark400' : '$textLight400'}
    >
      {label}
    </Text>
  </VStack>
);

export const ProfileStats = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
      borderRadius="$lg"
      p="$4"
    >
      <HStack justifyContent="center" space="xl">
        <StatItem value="776" label="Trust" isDark={isDark} />
        <Divider orientation="vertical" height={38} />
        <StatItem value="556" label="Truster" isDark={isDark} />
        <Divider orientation="vertical" height={38} />
        <StatItem value="2K" label="Destekçi" isDark={isDark} />
      </HStack>
    </Box>
  );
};
