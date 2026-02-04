import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  ButtonText,
  Pressable
} from '@gluestack-ui/themed';
import { TextInput, View } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';

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

  // Edge-to-Edge Design: Top insets için beyaz background
  const backgroundColor = '#FFFFFF';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const nextFocusIndexRef = useRef<number | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // İlk ekran açıldığında 0. input focus
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Code değiştiğinde bir sonraki hücreye focus taşı (rakam girince sağa kayar)
  useEffect(() => {
    if (nextFocusIndexRef.current === null) return;
    const nextIndex = nextFocusIndexRef.current;
    nextFocusIndexRef.current = null;

    const attemptFocus = (retryCount = 0) => {
      const nextRef = inputRefs.current[nextIndex];
      if (nextRef) {
        nextRef.focus();
        setFocusedIndex(nextIndex);
      } else if (retryCount < 15) {
        setTimeout(() => attemptFocus(retryCount + 1), 20);
      }
    };

    setTimeout(() => attemptFocus(), 0);
  }, [code]);

  // Focus handler - focusedIndex'i güncelle
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  // Rakam girince sağdaki hücreye geç; yapıştırınca 6 hane tüm hücrelere sırayla
  const handleCodeChange = (value: string, index: number) => {
    const digits = value.replace(/[^0-9]/g, '');

    // 6 haneli yapıştırma: Hangi hücrede olursa olsun, tüm hücrelere doğru sırayla yerleştir
    if (digits.length >= 6) {
      const codeToPaste = digits.slice(0, 6).split('');
      setCode(codeToPaste);
      nextFocusIndexRef.current = null;
      return;
    }

    // 2–5 karakter (kısmi yapıştırma): Mevcut hücreden başlayarak dağıt
    if (digits.length > 1) {
      setCode((prevCode) => {
        const newCode = [...prevCode];
        let pos = index;
        for (let i = 0; i < digits.length && pos < 6; i++) {
          newCode[pos] = digits[i];
          pos++;
        }
        nextFocusIndexRef.current = pos < 6 ? pos : null;
        return newCode;
      });
      return;
    }

    // Tek rakam: Mevcut hücreye yaz, sonraki (sağdaki) hücreye geç
    const digit = digits.slice(0, 1);
    if (!digit) return;

    setCode((prevCode) => {
      const newCode = [...prevCode];
      newCode[index] = digit;
      nextFocusIndexRef.current = index < 5 ? index + 1 : null;
      return newCode;
    });
  };

  // Backspace: Mevcut hücre doluysa sil; boşsa soldaki hücreyi sil ve oraya geç
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      nextFocusIndexRef.current = null;
      setCode((prevCode) => {
        const newCode = [...prevCode];
        if (newCode[index]) {
          newCode[index] = '';
        } else if (index > 0) {
          newCode[index - 1] = '';
          nextFocusIndexRef.current = index - 1;
        }
        return newCode;
      });
    }
  };

  const isCodeComplete = code.every(d => d !== '');

  const handleVerify = () => {
    const verificationCode = code.join('');
    if (verificationCode.length === 6) onVerify(verificationCode);
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

            {/* PIN Input */}
            <VStack space="md" alignItems="center">
              <HStack space="md" justifyContent="center">
                {code.map((digit, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      inputRefs.current[index]?.focus();
                      setFocusedIndex(index);
                    }}
                  >
                    <Box
                      w={43}
                      h={59}
                      alignItems="center"
                      justifyContent="center"
                      borderWidth={1}
                      borderColor={
                        focusedIndex === index
                          ? (isDark ? '#FFFFFF' : '#000000')
                          : '#E9E9E9'
                      }
                      borderRadius={8}
                      bg="transparent"
                    >
                      <Text
                        fontSize={32}
                        fontWeight="$medium"
                        color={digit ? (isDark ? '#FFFFFF' : '#000000') : '#C1BEBF'}
                      >
                        {digit || ''}
                      </Text>

                      <TextInput
                        ref={ref => {
                          inputRefs.current[index] = ref;
                        }}
                        value={digit}
                        onChangeText={text => handleCodeChange(text, index)}
                        onKeyPress={e => handleKeyPress(e, index)}
                        onFocus={() => handleFocus(index)}
                        keyboardType="number-pad"
                        maxLength={6}
                        style={{
                          position: 'absolute',
                          width: 43,
                          height: 59,
                          opacity: 0.02,
                          color: 'transparent',
                        }}
                      />
                    </Box>
                  </Pressable>
                ))}
              </HStack>
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
