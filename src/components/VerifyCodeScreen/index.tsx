import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  ButtonText,
  Pressable
} from '@gluestack-ui/themed';
import { TextInput } from 'react-native';
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

  // Code değiştiğinde otomatik focus yap
  useEffect(() => {
    if (nextFocusIndexRef.current !== null) {
      const nextIndex = nextFocusIndexRef.current;
      nextFocusIndexRef.current = null;
      
      const attemptFocus = (retryCount = 0) => {
        const nextRef = inputRefs.current[nextIndex];
        if (nextRef) {
          nextRef.focus();
          setFocusedIndex(nextIndex);
        } else if (retryCount < 10) {
          setTimeout(() => attemptFocus(retryCount + 1), 30);
        }
      };
      
      requestAnimationFrame(() => {
        attemptFocus();
      });
    }
  }, [code]);

  // Focus handler - focusedIndex'i güncelle
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  // Digit değişimi → sonraki input focus
  const handleCodeChange = (value: string, index: number) => {
    // Sadece rakamları kabul et
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;
    
    // Functional update kullanarak güncel state'i garanti et
    setCode((prevCode) => {
      const newCode = [...prevCode];
      newCode[index] = digit;
      
      // Rakam girildiyse sonraki input'a geçmek için işaretle
      if (digit && index < 5) {
        nextFocusIndexRef.current = index + 1;
      }
      
      return newCode;
    });
  };

  // Backspace → önceki input'a dön
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      setCode((prevCode) => {
        const newCode = [...prevCode];
        
        if (newCode[index]) {
          // Eğer mevcut input'ta karakter varsa, onu sil
          newCode[index] = '';
        } else if (index > 0) {
          // Eğer mevcut input boşsa, önceki input'a geç ve onu sil
          newCode[index - 1] = '';
          setTimeout(() => {
            inputRefs.current[index - 1]?.focus();
            setFocusedIndex(index - 1);
          }, 50);
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
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>

      <Header
        title={headerTitle}
        showBackButton={!!onBackPress}
        onBackPress={onBackPress}
      />
      
      <VStack flex={1} space="xl" p="$4" pt="$16">
          <Text fontSize={22} fontWeight="$bold" color={isDark ? '#FFFFFF' : '#000000'}>
          {title}
        </Text>
        
          <Text fontSize={10} color={isDark ? '#FFFFFF' : '#000000'} lineHeight={12}>
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

                    {/* ⛔ Artık invisible değil → tamamen görünmez ama input eventlerini alıyor */}
                    <TextInput
                      ref={ref => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={text => handleCodeChange(text, index)}
                      onKeyPress={e => handleKeyPress(e, index)}
                      onFocus={() => handleFocus(index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      style={{
                        position: 'absolute',
                        width: 43,
                        height: 59,
                        opacity: 0.02,
                        color: 'transparent',
                      }}
                      autoFocus={index === 0}
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
    </SafeAreaView>
  );
};

export default VerifyCodeScreen;
