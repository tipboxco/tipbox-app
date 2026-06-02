import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  Box,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export interface SupportRequestFilter {
  id: string;
  name: string;
  isActive: boolean;
}

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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <HStack space="xs" justifyContent="flex-start">
        {filters.map((filter) => (
          <Pressable key={filter.id} onPress={() => onFilterPress(filter.id)}>
            <Box
              bg={activeFilter === filter.id ? '#F1F1F1' : 'transparent'}
              borderWidth={1}
              borderColor={isDark ? '#333333' : '#EFEFEF'}
              borderRadius={10}
              px="$3"
              py="$1"
              minHeight={28}
              justifyContent="center"
              alignItems="center"
            >
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize="$xs"
                fontWeight="$semibold"
                textAlign="center"
              >
                {filter.name}
              </Text>
            </Box>
          </Pressable>
        ))}
      </HStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: 0,
    paddingHorizontal: 0,
    marginVertical: 0,
    paddingVertical: 0,
    marginBottom: 0,
    paddingBottom: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginVertical: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
});

export default SupportRequestFilterGroup;
