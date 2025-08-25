import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ComboBoxProps {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (value: string) => void;
}

export const ComboBox: React.FC<ComboBoxProps> = ({
  label,
  value,
  options,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box>
      <Pressable onPress={() => setIsOpen(!isOpen)}>
        <Box
          bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
          borderRadius="$lg"
          p="$4"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text
            color={value ? (isDark ? '$textDark50' : '$textLight900') : isDark ? '$textDark400' : '$textLight500'}
            size="sm"
          >
            {value || label}
          </Text>
          <Feather
            name={isOpen ? 'chevron-up' : 'chevron-right'}
            size={20}
            color={isDark ? '#666666' : '#999999'}
          />
        </Box>
      </Pressable>

      {isOpen && (
        <VStack
          bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
          borderRadius="$lg"
          mt="$1"
          overflow="hidden"
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1}
        >
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              <Box
                p="$4"
                borderBottomWidth={1}
                borderBottomColor={isDark ? '$borderDark400' : '$borderLight400'}
              >
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  size="sm"
                >
                  {option}
                </Text>
              </Box>
            </Pressable>
          ))}
        </VStack>
      )}
    </Box>
  );
};
