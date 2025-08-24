import React, { useRef, useEffect } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { Box, Text, useColorMode } from '@gluestack-ui/themed';

interface PinInputProps {
  code: string[];
  onChange: (text: string, index: number) => void;
}

export const PinInput: React.FC<PinInputProps> = ({ code, onChange }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // İlk input'a otomatik fokus
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (text: string, index: number) => {
    onChange(text, index);

    // Karakter girildiğinde sonraki input'a geç
    if (text && index < code.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Backspace tuşuna basıldığında önceki input'a geç
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {code.map((digit, index) => (
        <Box
          key={index}
          w="$12"
          h="$16"
          borderWidth={1}
          borderColor={isDark ? '$borderDark100' : '$borderLight100'}
          borderRadius="$lg"
          justifyContent="center"
          alignItems="center"
          bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
        >
          <TextInput
            ref={ref => {
              if (ref) {
                inputRefs.current[index] = ref;
              }
            }}
            style={[
              styles.input,
              { color: isDark ? '#FFFFFF' : '#000000' }
            ]}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        </Box>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
});
