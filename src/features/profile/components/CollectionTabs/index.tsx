import React from 'react';
import { Box, HStack, Text, Pressable, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';

interface CollectionTabsProps {
  activeTab: 'achievements' | 'bridges';
  onTabChange: (tab: 'achievements' | 'bridges') => void;
}

export const CollectionTabs: React.FC<CollectionTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('profile');

  const tabs = [
    { id: 'achievements' as const, label: t('collections.achievementBadges') },
    { id: 'bridges' as const, label: t('collections.bridgeBadges') },
  ];

  return (
    <Box
      bg={isDark ? '$backgroundDark900' : '$white'}
      borderBottomWidth={1}
      borderBottomColor={isDark ? '$borderDark800' : '$borderLight200'}
    >
      <HStack px="$4" space="md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              flex={1}
              py="$2"
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Text
                  fontSize={14}
                  fontWeight="$bold"
                  color={
                    isActive
                      ? isDark
                        ? '$textDark50'
                        : '$textLight950'
                      : isDark
                      ? '$textDark400'
                      : '$textLight500'
                  }
                >
                  {tab.label}
                </Text>
              </VStack>
              <Box
                position="absolute"
                bottom={-1}
                left="25%"
                height={2}
                width="50%"
                borderRadius={999}
                bg={isActive ? (isDark ? '#FFFFFF' : '#000000') : 'transparent'}
              />
            </Pressable>
          );
        })}
      </HStack>
    </Box>
  );
};

export default CollectionTabs;

