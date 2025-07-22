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
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)',
        padding: 16,
      }}
    >
      <VStack style={{ gap: 16 }}>
        <Button
          style={{
            backgroundColor: isDark ? '#4F46E5' : '#6366F1',
            padding: 16,
            borderRadius: 8,
          }}
          onPress={sendTestNotification}
        >
          <ButtonText>Test Bildirimi Gönder</ButtonText>
        </Button>

        <Button
          style={{
            backgroundColor: isDark ? '#4F46E5' : '#6366F1',
            padding: 16,
            borderRadius: 8,
          }}
          onPress={sendDelayedNotification}
        >
          <ButtonText>1 Dakika Sonra Bildirim Gönder</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}; 