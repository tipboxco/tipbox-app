import React from 'react';
import { Box, HStack, Switch, Text, VStack } from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Moon } from 'lucide-react-native';
import { OTAUpdateCard } from '../../components/OTAUpdateCard';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from 'react-i18next';

export const SettingsTab = () => {
  const { t } = useTranslation('settings');
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      p="$4"
    >
      <HStack
        alignItems="center"
        justifyContent="space-between"
        bg={isDark ? '$backgroundDark0' : '$backgroundLight0'}
        p="$4"
        rounded="$lg"
      >
        <HStack alignItems='center' gap={"$2"}>
          <Moon size={20} color={isDark ? '#F9FAFB' : '#111827'} />
          <Text
            fontSize="$md"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            {t('tabs.settingsTab.darkMode')}
          </Text>
        </HStack>
        <Switch
          value={isDark}
          onValueChange={toggleColorMode}
          trackColor={{ true: '#6366F1', false: '#D1D5DB' }}
          thumbColor={isDark ? '#818CF8' : '#FFFFFF'}
        />
      </HStack>
      <VStack mt="$4" space="lg">
        <OTAUpdateCard />
      </VStack>
    </Box>
    </SafeAreaView>
  );
}; 