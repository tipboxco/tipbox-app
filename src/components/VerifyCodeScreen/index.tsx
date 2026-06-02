import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  Text,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { View, Platform } from 'react-native';
import type { TextInputProps } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';

const CELL_COUNT = 6;
const autoComplete = Platform.select<TextInputProps['autoComplete']>({
  android: 'sms-otp',
  default: 'one-time-code',
});

interface VerifyCodeScreenProps {
  headerTitle: string;
  title: string;
  description: string;
  maskedEmail: string;
  onVerify: (code: string) => void;
  onBackPress?: () => void;
  isLoading?: boolean;
}

export const VerifyCodeScreen = ({
  headerTitle,
  title,
  description,
  maskedEmail,
  onVerify,
  onBackPress,
  isLoading = false
}: VerifyCodeScreenProps) => {

  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const insets = useSafeAreaInsets();

  const backgroundColor = isDark ? '#0A0A0A' : '#FFFFFF';

  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [clearByFocusCellProps, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  const handleChangeText = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, CELL_COUNT);
    setValue(digits);
  };

  const isCodeComplete = value.length === CELL_COUNT;

  const handleVerify = () => {
    if (value.length === CELL_COUNT) onVerify(value);
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>


      {/* Ana İçerik - paddingTop ile Header beyaz alanın altında kalır */}
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} p="$4">
          <Header
            title={headerTitle}
            showBackButton={!!onBackPress}
            onBackPress={onBackPress}
          />

          <VStack flex={1} space="xl" pt="$16">
            <Text
              fontSize="$2xl"
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              {title}
            </Text>

            <Text
              fontSize="$sm"
              color={isDark ? '$textDark300' : '$textLight600'}
              mb="$4"
            >
              {description}{'\n'}{maskedEmail}
            </Text>

            {/* PIN Input - react-native-confirmation-code-field */}
            <VStack space="md" alignItems="center" mt="$2">
              <CodeField
                ref={ref}
                {...clearByFocusCellProps}
                value={value}
                onChangeText={handleChangeText}
                cellCount={CELL_COUNT}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete={autoComplete}
                rootStyle={{ gap: 12 }}
                renderCell={({ index, symbol, isFocused }) => (
                  <Box
                    key={index}
                    w={43}
                    h={59}
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={1}
                    borderColor={
                      isFocused
                        ? isDark ? '#FFFFFF' : '#000000'
                        : isDark ? '#444444' : '#E9E9E9'
                    }
                    borderRadius={8}
                    bg="transparent"
                    onLayout={getCellOnLayoutHandler(index)}
                  >
                    {symbol ? (
                      <Text
                        fontSize={32}
                        fontWeight="$medium"
                        color={isDark ? '#FFFFFF' : '#000000'}
                      >
                        {symbol}
                      </Text>
                    ) : isFocused ? (
                      <Text fontSize={32} fontWeight="$medium" color={isDark ? '#FFFFFF' : '#000000'}>
                        <Cursor />
                      </Text>
                    ) : (
                      <Text fontSize={32} fontWeight="$medium" color="#C1BEBF">
                        {' '}
                      </Text>
                    )}
                  </Box>
                )}
              />
            </VStack>

            {/* Button */}
            <Button
              bg="#D8FF08"
              borderRadius={8}
              py="$3"
              onPress={handleVerify}
              opacity={isCodeComplete ? 1 : 0.5}
              disabled={!isCodeComplete || isLoading}
            >
              <ButtonText color="#111111" fontSize={14} fontWeight="$bold">
                {isLoading ? 'Verifying...' : 'Next'}
              </ButtonText>
            </Button>
          </VStack>
        </Box>
      </View>
    </View>
  );
};

export default VerifyCodeScreen;
