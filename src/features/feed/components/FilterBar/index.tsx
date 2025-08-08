import React from 'react';
import { HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather as FeatherIcon } from '@expo/vector-icons';

interface FilterOption {
  id: string;
  label: string;
  icon: 'filter' | 'type' | 'grid' | 'bar-chart-2';
  onPress: () => void;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'interest',
    label: 'Interest',
    icon: 'filter',
    onPress: () => {},
  },
  {
    id: 'type',
    label: 'Type',
    icon: 'type',
    onPress: () => {},
  },
  {
    id: 'category',
    label: 'Category',
    icon: 'grid',
    onPress: () => {},
  },
  {
    id: 'sort',
    label: 'Sort',
    icon: 'bar-chart-2',
    onPress: () => {},
  },
];

export const FilterBar = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack justifyContent='space-evenly' space="sm" px="$4" py="$2">
      {FILTER_OPTIONS.map((option) => (
        <Pressable
          key={option.id}
          flexDirection="row"
          alignItems="center"
          gap="$1"
          px="$3"
          py="$1.5"
          borderWidth={1}
          borderColor={isDark ? '$backgroundDark200' : '$borderLight400'}
          rounded="$lg"
          bg="transparent"
          onPress={option.onPress}
          opacity={0.8}
          $hover={{ opacity: 1 }}
        >
          <FeatherIcon
            name={option.icon}
            size={12}
            color={isDark ? '#94A3B8' : '#545454'}
          />
          <Text
            color={isDark ? '$textDark400' : '$textLight400'}
            fontSize="$2xs"
            fontWeight="$semibold"
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </HStack>
  );
};
