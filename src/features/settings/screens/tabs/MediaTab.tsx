import React, { useState } from 'react';
import { Image } from 'react-native';
import { Box, Button, ButtonText, VStack, ScrollView, HStack } from '@gluestack-ui/themed';
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
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)',
        padding: 16,
      }}
    >
      <VStack style={{ gap: 16 }}>
        <HStack style={{ gap: 16 }}>
          <Button
            style={{
              flex: 1,
              backgroundColor: isDark ? '#4F46E5' : '#6366F1',
              padding: 16,
              borderRadius: 8,
            }}
            onPress={pickImages}
          >
            <ButtonText>Galeriden Seç</ButtonText>
          </Button>

          <Button
            style={{
              flex: 1,
              backgroundColor: isDark ? '#4F46E5' : '#6366F1',
              padding: 16,
              borderRadius: 8,
            }}
            onPress={takePhoto}
          >
            <ButtonText>Fotoğraf Çek</ButtonText>
          </Button>
        </HStack>

        <ScrollView style={{ marginTop: 16 }}>
          {cameraPhoto && (
            <Box style={{ marginBottom: 16 }}>
              <Image
                source={{ uri: cameraPhoto }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 8,
                }}
              />
            </Box>
          )}

          {selectedImages.map((uri, index) => (
            <Box key={index} style={{ marginBottom: 16 }}>
              <Image
                source={{ uri }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 8,
                }}
              />
            </Box>
          ))}
        </ScrollView>
      </VStack>
    </Box>
  );
}; 