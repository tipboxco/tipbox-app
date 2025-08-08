import React, { useState } from 'react';
import { Box, Button, ButtonText, VStack, ScrollView, HStack, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

export const MediaTab = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [cameraPhoto, setCameraPhoto] = useState<string | null>(null);

  const pickImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Galeri izni gereklidir!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setSelectedImages(uris);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await Camera.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Kamera izni gereklidir!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setCameraPhoto(result.assets[0].uri);
    }
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      p="$4"
    >
      <VStack gap="$4">
        <HStack gap="$4">
          <Button
            flex={1}
            bg={isDark ? '$primary600' : '$primary500'}
            rounded="$lg"
            onPress={pickImages}
          >
            <ButtonText>Galeriden Seç</ButtonText>
          </Button>

          <Button
            flex={1}
            bg={isDark ? '$primary600' : '$primary500'}
            rounded="$lg"
            onPress={takePhoto}
          >
            <ButtonText>Fotoğraf Çek</ButtonText>
          </Button>
        </HStack>

        <ScrollView mt="$4">
          {cameraPhoto && (
            <Box mb="$4">
              <Image
                w="100%"
                h={200}
                rounded="$lg"
                source={{ uri: cameraPhoto }}
              />
            </Box>
          )}

          {selectedImages.map((uri, index) => (
            <Box mb="$4" key={index}>
              <Image
                w="100%"
                h={200}
                rounded="$lg"
                source={{ uri }}
              />
            </Box>
          ))}
        </ScrollView>
      </VStack>
    </Box>
  );
}; 