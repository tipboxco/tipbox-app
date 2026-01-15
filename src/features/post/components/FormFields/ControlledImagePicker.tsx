import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, HStack, Text, VStack, Pressable, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ControlledImagePickerProps {
  name: string;
  label?: string;
  maxImages?: number;
  onImagePicker: () => void;
  onRemoveImage?: (index: number) => void;
}

export const ControlledImagePicker: React.FC<ControlledImagePickerProps> = ({
  name,
  label,
  maxImages = 10,
  onImagePicker,
  onRemoveImage,
}) => {
  const { control, watch } = useFormContext();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const images = watch(name) || [];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedImages = value || [];
        
        const handleRemove = (index: number) => {
          const newImages = selectedImages.filter((_: any, i: number) => i !== index);
          onChange(newImages);
          if (onRemoveImage) {
            onRemoveImage(index);
          }
        };

        return (
          <VStack space="xs">
            {label && (
              <Text
                color={isDark ? '$textDark400' : '#A3A3A3'}
                fontSize="$sm"
                fontWeight="$bold"
              >
                {label}
              </Text>
            )}
            <HStack space="sm" flexWrap="wrap">
              {/* Display selected images */}
              {selectedImages.map((imageUri: string, index: number) => (
                <Box
                  key={index}
                  width={64}
                  height={64}
                  borderRadius={5}
                  overflow="hidden"
                  position="relative"
                >
                  <Image
                    source={{ uri: imageUri }}
                    width={64}
                    height={64}
                    resizeMode="cover"
                    alt={`Selected image ${index + 1}`}
                  />
                  <Pressable
                    position="absolute"
                    top={2}
                    right={2}
                    bg="rgba(0, 0, 0, 0.5)"
                    borderRadius={12}
                    width={20}
                    height={20}
                    justifyContent="center"
                    alignItems="center"
                    onPress={() => handleRemove(index)}
                  >
                    <Feather
                      name="x"
                      size={12}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </Box>
              ))}

              {/* Add Image Button */}
              {selectedImages.length < maxImages && (
                <Pressable onPress={onImagePicker}>
                  <Box
                    width={64}
                    height={64}
                    bg={isDark ? '$backgroundDark800' : '#F5F5F5'}
                    borderWidth={1}
                    borderColor="#9E9E9E"
                    borderStyle="dashed"
                    borderRadius={5}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Feather
                      name="plus"
                      size={24}
                      color={isDark ? '#C1BEBF' : '#C1BEBF'}
                    />
                  </Box>
                </Pressable>
              )}
            </HStack>
            {error && (
              <Text color="#CE4A4A" fontSize="$xs" px={2}>
                {error.message}
              </Text>
            )}
          </VStack>
        );
      }}
    />
  );
};


