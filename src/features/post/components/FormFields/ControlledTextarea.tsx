import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, Text, Textarea, TextareaInput, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ControlledTextareaProps {
  name: string;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  label?: string;
}

export const ControlledTextarea: React.FC<ControlledTextareaProps> = ({
  name,
  placeholder,
  maxLength = 500,
  minHeight = 174,
  label,
}) => {
  const { control, watch } = useFormContext();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const value = watch(name);
  const characterCount = value?.length || 0;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <VStack space="xs">
          {label && (
            <Text
              color={isDark ? '$textDark400' : '#B9B9B9'}
              fontSize="$sm"
              fontWeight="$bold"
            >
              {label}
            </Text>
          )}
          <Box
            bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
            borderWidth={1}
            borderColor={error ? '#CE4A4A' : '#E9E9E9'}
            $dark-borderColor={error ? '#CE4A4A' : '$borderDark600'}
            borderRadius={5}
            overflow="hidden"
            minHeight={minHeight}
            position="relative"
          >
            <Textarea
              bg="transparent"
              borderWidth={0}
              flex={1}
              minHeight={minHeight}
            >
              <TextareaInput
                placeholder={placeholder}
                placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                color={isDark ? '$textDark50' : '#000000'}
                fontSize="$sm"
                lineHeight="$md"
                value={value || ''}
                onChangeText={onChange}
                maxLength={maxLength}
                style={{
                  textAlignVertical: 'top',
                  paddingTop: 12,
                  paddingBottom: 36,
                  paddingLeft: 12,
                  paddingRight: 12,
                }}
              />
            </Textarea>

            {/* Character Count - Bottom Right */}
            <Box
              position="absolute"
              bottom={8}
              right={8}
            >
              <Text
                color={isDark ? '$textDark400' : '#A3A3A3'}
                fontSize="$xs"
                fontWeight="$medium"
              >
                {characterCount}/{maxLength}
              </Text>
            </Box>
          </Box>
          {error && (
            <Text color="#CE4A4A" fontSize="$xs" px={2}>
              {error.message}
            </Text>
          )}
        </VStack>
      )}
    />
  );
};


