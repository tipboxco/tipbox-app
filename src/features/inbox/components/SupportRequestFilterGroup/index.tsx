import React from 'react';
import {
  Box,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SupportRequestFilter } from '@/src/mock/inbox/SupportRequests/types';

interface SupportRequestFilterGroupProps {
  filters: SupportRequestFilter[];
  activeFilter: string;
  onFilterPress: (filterId: string) => void;
}

export const SupportRequestFilterGroup: React.FC<SupportRequestFilterGroupProps> = ({
  filters,
  activeFilter,
  onFilterPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack space="xs" justifyContent="flex-start">
      {filters.map((filter) => (
        <Pressable key={filter.id} onPress={() => onFilterPress(filter.id)}>
          <Box
            bg={activeFilter === filter.id ? '#F1F1F1' : 'transparent'}
            borderWidth={1}
            borderColor="#EFEFEF"
            borderRadius={20}
            px="$3"
            py="$1"
            minHeight={28}
            justifyContent="center"
            alignItems="center"
          >
            <Text
              color={isDark ? '#000000' : '#000000'}
              fontSize={9}
              fontWeight="$semibold"
              textAlign="center"
            >
              {filter.name}
            </Text>
          </Box>
        </Pressable>
      ))}
    </HStack>
  );
};

export default SupportRequestFilterGroup;
