import React from 'react';
import { Box, Button, ButtonText, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationTab = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Bildirimi',
        body: 'Bu bir test bildirimidir.',
      },
      trigger: {
        seconds: 1,
        repeats: false,
      },
    });
  };

  const sendDelayedNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Gecikmeli Bildirim',
        body: '1 dakika sonra gönderilen bildirim.',
      },
      trigger: {
        seconds: 60,
        repeats: false,
      },
    });
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
      p="$4"
    >
      <VStack gap={"$4"}>
        <Button
          bg={isDark ? '$primary600' : '$primary500'}
          rounded="$lg"
          onPress={sendTestNotification}
        >
          <ButtonText>Test Bildirimi Gönder</ButtonText>
        </Button>

        <Button
          bg={isDark ? '$primary600' : '$primary500'}
          rounded="$lg"
          onPress={sendDelayedNotification}
        >
          <ButtonText>1 Dakika Sonra Bildirim Gönder</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}; 