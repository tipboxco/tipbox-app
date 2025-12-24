import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, HStack, Text, VStack, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ControlledStarRatingProps {
  name: string;
  label?: string;
  disabled?: boolean;
}

export const ControlledStarRating: React.FC<ControlledStarRatingProps> = ({
  name,
  label = 'Rate Experience',
  disabled = false,
}) => {
  const { control } = useFormContext();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const rating = value || 0;
        
        return (
          <VStack space="xs">
            <Text
              fontSize={11}
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '#3B3B3B'}
            >
              {label}
            </Text>
            <HStack space="xs">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => !disabled && onChange(star)}
                  disabled={disabled}
                >
                  <Feather
                    name="star"
                    size={24}
                    color={star <= rating ? '#829905' : '#E9E9E9'}
                    fill={star <= rating ? '#829905' : 'transparent'}
                  />
                </Pressable>
              ))}
            </HStack>
            {error && (
              <Text color="#CE4A4A" fontSize={9} px={2}>
                {error.message}
              </Text>
            )}
          </VStack>
        );
      }}
    />
  );
};


