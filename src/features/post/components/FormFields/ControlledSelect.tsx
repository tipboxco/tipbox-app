import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Box,
  Text,
  VStack,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  ChevronDownIcon,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SelectOption {
  label: string;
  value: string;
}

interface ControlledSelectProps {
  name: string;
  placeholder?: string;
  options: SelectOption[];
  label?: string;
}

export const ControlledSelect: React.FC<ControlledSelectProps> = ({
  name,
  placeholder,
  options,
  label,
}) => {
  const { control } = useFormContext();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <VStack space="xs">
          {label && (
            <Text
              color={isDark ? '$textDark400' : '#B9B9B9'}
              fontSize={10}
              fontWeight="$bold"
            >
              {label}
            </Text>
          )}
          <Select
            selectedValue={value || ''}
            onValueChange={onChange}
          >
            <SelectTrigger
              variant="outline"
              size="md"
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor={error ? '#CE4A4A' : '#E9E9E9'}
              $dark-borderColor={error ? '#CE4A4A' : '$borderDark600'}
              borderRadius={10}
              height={44}
            >
              <SelectInput
                placeholder={placeholder}
                placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                color={value ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                fontSize={10}
                fontWeight="$medium"
              />
              <SelectIcon mr="$3" as={ChevronDownIcon} />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
          {error && (
            <Text color="#CE4A4A" fontSize={9} px={2}>
              {error.message}
            </Text>
          )}
        </VStack>
      )}
    />
  );
};


