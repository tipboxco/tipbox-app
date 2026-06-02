import React from 'react';
import {
  HStack,
  Pressable,
  Text,
  Box,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export type FilterOption = 'All' | 'Not Started' | 'In Progress' | 'Completed';

interface AchievementFilterProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

export const AchievementFilter: React.FC<AchievementFilterProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const filters: FilterOption[] = ['All', 'Not Started', 'In Progress', 'Completed'];

  return (
    <HStack space="xs" justifyContent="flex-start" mb='$4'>
      {filters.map((filter) => (
        <Pressable
          key={filter}
          onPress={() => onFilterChange(filter)}
        >
          <Box
            bg={activeFilter === filter ? 'rgba(229, 229, 229, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
            borderWidth={1}
            borderColor={isDark ? '#333333' : '#EFEFEF'}
            borderRadius={10}
            px='$4'
            py="$2"
          >
            <Text
              color="#000000"
              fontSize="$xs"
              fontWeight="$semibold"
              textAlign="center"
            >
              {filter}
            </Text>
          </Box>
        </Pressable>
      ))}
    </HStack>
  );
};

export default AchievementFilter;
