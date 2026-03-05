import React, { useState } from 'react';
import { Box, VStack, HStack, Pressable, Text, Icon } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/src/i18n/languages';
import i18n from '@/src/i18n';
import { Check } from 'lucide-react-native';

interface LanguageBottomSheetProps {
  onClose: () => void;
}

export const LanguageBottomSheet: React.FC<LanguageBottomSheetProps> = ({ onClose }) => {
  const { t } = useTranslation('settings');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    i18n.language as SupportedLanguage
  );

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      // Close bottom sheet after a short delay to show the selection
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <Box
      bg={isDark ? '#1A1A1A' : '#FDFDFB'}
      borderTopLeftRadius={30}
      borderTopRightRadius={30}
      px="$4"
      pt="$4"
      pb="$6"
    >
      {/* Header */}
      <Box mb="$4">
        <Text
          fontSize="$xl"
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
          textAlign="center"
        >
          {t('languages.title', 'Dil / Language')}
        </Text>
      </Box>

      {/* Language Options */}
      <VStack space="xs">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, language]) => {
          const isSelected = currentLanguage === code;
          const isEnabled = language.enabled;

          return (
            <Pressable
              key={code}
              onPress={() => isEnabled && handleLanguageChange(code as SupportedLanguage)}
              bg={isSelected ? (isDark ? '#2A2A2A' : '#F2F2F2') : 'transparent'}
              borderRadius="$md"
              p="$3"
              opacity={isEnabled ? 1 : 0.4}
              disabled={!isEnabled}
            >
              <HStack alignItems="center" justifyContent="space-between">
                <VStack>
                  <HStack alignItems="center" space="xs">
                    <Text
                      fontSize="$md"
                      fontWeight={isSelected ? '$bold' : '$normal'}
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {language.nativeName}
                    </Text>
                    {!isEnabled && (
                      <Text
                        fontSize="$xs"
                        color={isDark ? '#666666' : '#999999'}
                        fontWeight="$medium"
                      >
                        ({t('languages.comingSoon')})
                      </Text>
                    )}
                  </HStack>
                  <Text
                    fontSize="$sm"
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  >
                    {language.name}
                  </Text>
                </VStack>

                {isSelected && isEnabled && (
                  <Icon
                    as={Check}
                    size="md"
                    color={isDark ? '$primary400' : '$primary600'}
                  />
                )}
              </HStack>
            </Pressable>
          );
        })}
      </VStack>
    </Box>
  );
};
