import React from 'react';
import { Box, VStack, Text, ScrollView } from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';

export const SubscriptionTab: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
      <VStack space="md">
        <Text
          color={isDark ? '#FFFFFF' : '#000000'}
          fontSize={16}
          fontWeight="$semibold"
        >
          Subscription Plans
        </Text>
        {/* Subscription content will be added here */}
      </VStack>
    </ScrollView>
    </SafeAreaView>
  );
};

export default SubscriptionTab;

