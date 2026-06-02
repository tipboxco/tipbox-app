import React from 'react';
import { Box, VStack, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useAppStore } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Check } from 'lucide-react-native';

interface ThemeBottomSheetProps {
  onClose: () => void;
}

type ThemeOption = 'light' | 'dark' | 'system';

export const ThemeBottomSheet: React.FC<ThemeBottomSheetProps> = ({ onClose }) => {
  const { t } = useTranslation('settings');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const storedMode = useAppStore((state) => state.colorMode);
  const setColorMode = useAppStore((state) => state.setColorMode);

  const handleSelect = (mode: ThemeOption) => {
    setColorMode(mode);
    setTimeout(() => onClose(), 300);
  };

  const options: Array<{ key: ThemeOption; labelKey: string }> = [
    { key: 'light', labelKey: 'theme.light' },
    { key: 'dark', labelKey: 'theme.dark' },
    { key: 'system', labelKey: 'theme.system' },
  ];

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FDFDFB'}
      borderTopLeftRadius={30}
      borderTopRightRadius={30}
      px="$4"
      pt="$4"
      pb="$6"
    >
      <Box mb="$4">
        <Text fontSize="$xl" fontWeight="$bold" color={isDark ? '#FFFFFF' : '#000000'} textAlign="center">
          {t('theme.title')}
        </Text>
      </Box>

      <VStack space="xs">
        {options.map(({ key, labelKey }) => {
          const isSelected = storedMode === key;
          return (
            <Pressable
              key={key}
              onPress={() => handleSelect(key)}
              py="$3"
              px="$4"
              borderRadius="$lg"
              bg={isSelected ? (isDark ? '#2A2A2A' : '#F0F0F0') : 'transparent'}
            >
              <HStack alignItems="center" justifyContent="space-between">
                <Text
                  fontSize="$md"
                  fontWeight={isSelected ? '$bold' : '$medium'}
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  {t(labelKey)}
                </Text>
                {isSelected && <Check size={20} color={isDark ? '#FFFFFF' : '#000000'} />}
              </HStack>
            </Pressable>
          );
        })}
      </VStack>
    </Box>
  );
};
