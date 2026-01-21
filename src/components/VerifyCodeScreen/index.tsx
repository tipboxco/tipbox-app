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
import { TextInput, View, Clipboard } from 'react-native';
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
  const handleCodeChange = async (value: string, index: number) => {
    // Sadece rakamları kabul et
    const digits = value.replace(/[^0-9]/g, '');
    
    // Paste işlemini algıla: İlk input'a paste yapıldığında
    if (index === 0 && digits.length > 1) {
      // İlk input'a birden fazla karakter geldiğinde, paste işlemi yapılmış demektir
      // Tüm kodu dağıt
      setCode((prevCode) => {
        const newCode = [...prevCode];
        const codeToPaste = digits.slice(0, 6);
        
        for (let i = 0; i < 6; i++) {
          newCode[i] = codeToPaste[i] || '';
        }
        
        // Tüm kod dolduruldu, focus'u kaldır
        nextFocusIndexRef.current = null;
        
        return newCode;
      });
      return;
    }
    
    // İlk input'a tek karakter geldiğinde, clipboard'u kontrol et (paste olup olmadığını anlamak için)
    if (index === 0 && digits.length === 1) {
      try {
        const clipboardContent = await Clipboard.getString();
        const clipboardDigits = clipboardContent.replace(/[^0-9]/g, '');
        
        // Eğer clipboard'ta 6 haneli bir kod varsa ve kullanıcı paste yapmış olabilir
        // (Bazı durumlarda paste işlemi tek karakter olarak gelebilir)
        if (clipboardDigits.length >= 6) {
          // Paste işlemi: Tüm kodu dağıt
          setCode((prevCode) => {
            const newCode = [...prevCode];
            const codeToPaste = clipboardDigits.slice(0, 6);
            
            for (let i = 0; i < 6; i++) {
              newCode[i] = codeToPaste[i] || '';
            }
            
            // Tüm kod dolduruldu, focus'u kaldır
            nextFocusIndexRef.current = null;
            
            return newCode;
          });
          return;
        }
      } catch (error) {
        // Clipboard okuma hatası, normal akışa devam et
      }
    }
    
    // Yapıştırma işlemi: Eğer birden fazla karakter varsa (diğer input'larda), tüm kodu dağıt
    if (digits.length > 1) {
      setCode((prevCode) => {
        const newCode = [...prevCode];
        // Mevcut pozisyondan başlayarak, kalan hücrelere karakterleri dağıt
        let remainingDigits = digits.slice(0, 6); // Maksimum 6 karakter
        let currentIndex = index;
        
        while (remainingDigits.length > 0 && currentIndex < 6) {
          newCode[currentIndex] = remainingDigits[0];
          remainingDigits = remainingDigits.slice(1);
          currentIndex++;
        }
        
        // Son doldurulan hücreye focus yap
        const lastFilledIndex = Math.min(index + digits.length - 1, 5);
        if (lastFilledIndex < 6) {
          nextFocusIndexRef.current = lastFilledIndex;
        } else {
          // Tüm kod dolduruldu, focus'u kaldır
          nextFocusIndexRef.current = null;
        }
        
        return newCode;
      });
      return;
    }
    
    // Tek karakter girişi (normal kullanım)
    const digit = digits.slice(0, 1);
    
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
    <View style={{ flex: 1, backgroundColor }}>
      {/* Üst Güvenli Alan - Status Bar arkasını beyaz boyar */}
      <View 
        style={{ 
          height: insets.top, 
          backgroundColor,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }} 
      />

      {/* Ana İçerik */}
      <View style={{ flex: 1 }}>
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
                      maxLength={index === 0 ? 6 : 1}
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
      </View>
    </View>
  );
};

export default VerifyCodeScreen;
