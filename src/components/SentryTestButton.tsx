import React from 'react';
import { Pressable, Text, Alert } from 'react-native';
import { Sentry } from '@/src/config/sentry.config';

/**
 * Sentry Test Button
 * Development build'de Sentry'nin çalışıp çalışmadığını test etmek için kullan
 */
export const SentryTestButton = () => {
  const testSentryError = () => {
    try {
      console.log('[SentryTest] 🧪 Testing Sentry error capture...');

      // Test error gönder
      const testError = new Error('🧪 TEST: Sentry is working! (Development Build)');
      Sentry.captureException(testError, {
        tags: {
          test: 'true',
          build_type: 'development',
          feature: 'sentry_test_button',
        },
        level: 'info',
      });

      console.log('[SentryTest] ✅ Error sent to Sentry!');
      Alert.alert(
        '✅ Sentry Test',
        'Error gönderildi!\n\nSentry dashboard\'unda göreceksin:\n• Environment: development\n• Error: TEST: Sentry is working!',
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      console.error('[SentryTest] ❌ Failed to send error:', error);
      Alert.alert('❌ Error', 'Sentry test başarısız oldu. Console\'u kontrol et.');
    }
  };

  const testSentryTransaction = () => {
    try {
      console.log('[SentryTest] 🧪 Testing Sentry transaction...');

      // Test transaction
      const transaction = Sentry.startTransaction({
        name: 'test.sentry.transaction',
        op: 'test',
        tags: {
          test: 'true',
          build_type: 'development',
        },
      });

      // Simulate some work with spans
      const span1 = transaction.startChild({
        op: 'test.operation.1',
        description: 'Test operation 1',
      });

      setTimeout(() => {
        span1.finish();

        const span2 = transaction.startChild({
          op: 'test.operation.2',
          description: 'Test operation 2',
        });

        setTimeout(() => {
          span2.finish();
          transaction.setStatus('ok');
          transaction.finish();

          console.log('[SentryTest] ✅ Transaction completed!');
          Alert.alert(
            '✅ Transaction Test',
            'Transaction gönderildi!\n\nSentry Performance sekmesinde göreceksin.',
            [{ text: 'Tamam' }]
          );
        }, 500);
      }, 300);
    } catch (error) {
      console.error('[SentryTest] ❌ Failed to send transaction:', error);
    }
  };

  const testSentryCrash = () => {
    Alert.alert(
      '⚠️ Crash Test',
      'Bu app\'i crash edecek! Emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet, Crash Et',
          style: 'destructive',
          onPress: () => {
            console.log('[SentryTest] 💥 Triggering crash...');
            // @ts-ignore - Intentional crash
            const crash = null;
            crash.test(); // This will crash
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onPress={testSentryError}
      onLongPress={testSentryTransaction}
      style={{
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        margin: 16,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        🧪 Test Sentry (Press: Error | Long: Transaction)
      </Text>
    </Pressable>
  );
};

/**
 * Floating Test Button - Herhangi bir ekrana ekleyebilirsin
 */
export const FloatingSentryTestButton = () => {
  const [showMenu, setShowMenu] = React.useState(false);

  if (!__DEV__) return null; // Sadece development'ta göster

  return (
    <>
      {/* Main floating button */}
      <Pressable
        onPress={() => setShowMenu(!showMenu)}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#6366f1',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          zIndex: 9999,
        }}
      >
        <Text style={{ fontSize: 24 }}>🧪</Text>
      </Pressable>

      {/* Menu */}
      {showMenu && (
        <Pressable
          onPress={() => setShowMenu(false)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9998,
            justifyContent: 'flex-end',
            paddingBottom: 180,
            paddingRight: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              alignSelf: 'flex-end',
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 8,
              minWidth: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Pressable
              onPress={() => {
                setShowMenu(false);
                const testError = new Error('🧪 TEST: Sentry Error from floating button');
                Sentry.captureException(testError, {
                  tags: { test: 'true', source: 'floating_button' },
                  level: 'info',
                });
                Alert.alert('✅', 'Error sent to Sentry!');
              }}
              style={{
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 16 }}>🐛 Test Error</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowMenu(false);
                const transaction = Sentry.startTransaction({
                  name: 'test.floating.transaction',
                  op: 'test',
                });
                setTimeout(() => {
                  transaction.finish();
                  Alert.alert('✅', 'Transaction sent!');
                }, 1000);
              }}
              style={{
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb',
              }}
            >
              <Text style={{ fontSize: 16 }}>⚡ Test Transaction</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowMenu(false);
                Sentry.captureMessage('🧪 TEST: Manual message from floating button', {
                  level: 'info',
                  tags: { test: 'true' },
                });
                Alert.alert('✅', 'Message sent to Sentry!');
              }}
              style={{
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 16 }}>💬 Test Message</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </>
  );
};
