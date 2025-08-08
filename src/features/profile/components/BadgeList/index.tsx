import React from 'react';
import { Box, Text, Image, HStack, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface Badge {
  id: string;
  image: any;
  title: string;
}

interface BadgeListProps {
  badges: Badge[];
}

const BadgeList: React.FC<BadgeListProps> = ({ badges }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box width="100%" >
      <HStack 
        space="lg" 
        justifyContent="space-between" 
        alignItems="flex-start"
        flexWrap="nowrap"
      >
        {badges.map((badge) => (
          <VStack 
            key={badge.id} 
            alignItems="center" 
            space="xs" 
            flex={1}
          >
            <Box
              width={51}
              height={45}
              justifyContent="center"
              alignItems="center"
            >
              <Image
                source={badge.image}
                alt={badge.title}
                width={51}
                height={45}
                resizeMode="contain"
              />
            </Box>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize={10}
              fontWeight="$medium"
              textAlign="center"
              numberOfLines={2}
              style={{ lineHeight: 12 }}
            >
              {badge.title}
            </Text>
          </VStack>
        ))}
      </HStack>
    </Box>
  );
};

export default BadgeList;
