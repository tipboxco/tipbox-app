import React, { useState, useRef } from 'react';
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
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) return; // Sadece tek karakter
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Otomatik olarak bir sonraki input'a geç
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Eğer mevcut input boşsa ve backspace'e basıldıysa, önceki input'a geç
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleVerify = () => {
    const verificationCode = code.join('');
    if (verificationCode.length === 6) {
      onVerify(verificationCode);
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
      borderWidth={1}
      borderColor="#E9E9E9"
    >
      <Header
        title={headerTitle}
        showBackButton={!!onBackPress}
        onBackPress={onBackPress}
      />
      
      <VStack flex={1} space="xl" p="$4" pt="$16">
        {/* Title */}
        <Text
          fontSize={22}
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
          textAlign="left"
        >
          {title}
        </Text>
        
        {/* Description */}
        <Text
          fontSize={10}
          color={isDark ? '#FFFFFF' : '#000000'}
          textAlign="left"
          lineHeight={12}
        >
          {description}
          {'\n'}
          {maskedEmail}
        </Text>

        {/* Pin Input */}
        <VStack space="md" alignItems="center">
          <HStack space="md" justifyContent="center">
            {code.map((digit, index) => (
              <VStack key={index} alignItems="center" space="xs">
                <Pressable
                  onPress={() => {
                    inputRefs.current[index]?.focus();
                    setFocusedIndex(index);
                  }}
                >
                  <Box
                    w={43}
                    h={59}
                    bg="transparent"
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={focusedIndex === index ? 1 : 0}
                    borderColor={isDark ? '#FFFFFF' : '#000000'}
                    borderRadius={8}
                  >
                    <Text
                      fontSize={32}
                      fontWeight="$medium"
                      color={isDark ? '#FFFFFF' : '#C1BEBF'}
                      textAlign="center"
                    >
                      {digit || '0'}
                    </Text>
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      onFocus={() => handleFocus(index)}
                      keyboardType="numeric"
                      maxLength={1}
                      style={{
                        position: 'absolute',
                        width: 43,
                        height: 59,
                        opacity: 0,
                        fontSize: 32,
                        textAlign: 'center',
                        color: 'transparent',
                      }}
                      autoFocus={index === 0}
                    />
                  </Box>
                </Pressable>
                <Box
                  w={23}
                  h={1}
                  bg={isDark ? '#333333' : '#C8C8C8'}
                />
              </VStack>
            ))}
          </HStack>
        </VStack>

        {/* Verify Button */}
        <Button
          bg={isDark ? '#D8FF08' : '#D8FF08'}
          borderRadius={8}
          py="$3"
          onPress={handleVerify}
          opacity={isCodeComplete ? 1 : 0.5}
          disabled={!isCodeComplete || isLoading}
        >
          <ButtonText
            color={isDark ? '#111111' : '#111111'}
            fontSize={14}
            fontWeight="$bold"
            textAlign="center"
          >
            {isLoading ? 'Verifying...' : 'Next'}
          </ButtonText>
        </Button>
      </VStack>
    </Box>
  );
};

export default VerifyCodeScreen;
