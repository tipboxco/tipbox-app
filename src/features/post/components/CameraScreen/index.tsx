import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Box, Image, Pressable, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Images } from 'lucide-react-native';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';

interface CameraScreenProps {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
  lastPhotoUri?: string | null;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onPhotoTaken,
  onClose,
  lastPhotoUri,
}) => {
  const { t } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [lastPhoto, setLastPhoto] = useState<string | null>(lastPhotoUri || null);

  // lastPhotoUri prop'u değiştiğinde state'i güncelle
  React.useEffect(() => {
    if (lastPhotoUri) {
      setLastPhoto(lastPhotoUri);
    }
  }, [lastPhotoUri]);

  if (!permission) {
    // Permission is still loading
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D0F205" />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permission not granted
    return (
      <View style={styles.container}>
        <Box p="$4" alignItems="center" justifyContent="center" flex={1}>
          <Pressable
            onPress={requestPermission}
            bg="#D0F205"
            px="$6"
            py="$3"
            borderRadius="$lg"
          >
            <Text color="#111111" fontWeight="$bold">
              Kamera İzni Ver
            </Text>
          </Pressable>
        </Box>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        
        if (photo?.uri) {
          setLastPhoto(photo.uri);
          onPhotoTaken(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleGalleryPress = async () => {
    const remainingSlots = 10; // Max images
    const result = await imagePickerService.pickMultipleFromGallery(remainingSlots);

    if (result.success && result.assets && result.assets.length > 0) {
      // Pass each selected image (already JPEG-compressed by pickMultipleFromGallery)
      for (const asset of result.assets) {
        onPhotoTaken(asset.uri);
      }
      // Show last selected photo as preview
      setLastPhoto(result.assets[result.assets.length - 1].uri);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
      >
        {/* Top bar - Close button */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Box
              width={32}
              height={32}
              borderRadius={16}
              bg="rgba(0, 0, 0, 0.5)"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="#FFFFFF" fontSize={18} fontWeight="$bold">×</Text>
            </Box>
          </TouchableOpacity>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          {/* Left: Gallery button or last photo preview */}
          <TouchableOpacity onPress={handleGalleryPress} style={styles.galleryButton}>
            {lastPhoto ? (
              <Image
                source={{ uri: lastPhoto }}
                style={styles.lastPhotoPreview}
                alt={t('altTexts.lastPhoto')}
              />
            ) : (
              <Box
                width={50}
                height={50}
                borderRadius={8}
                bg="rgba(255, 255, 255, 0.3)"
                alignItems="center"
                justifyContent="center"
                borderWidth={2}
                borderColor="rgba(255, 255, 255, 0.5)"
              >
                <Images size={24} color="#FFFFFF" />
              </Box>
            )}
          </TouchableOpacity>

          {/* Center: Shutter button */}
          <TouchableOpacity
            onPress={takePicture}
            disabled={isCapturing}
            style={styles.shutterButton}
          >
            <View style={[styles.shutterButtonOuter, isCapturing && styles.shutterButtonDisabled]}>
              <View style={styles.shutterButtonInner} />
            </View>
          </TouchableOpacity>

          {/* Right: Flip camera button */}
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
            <Box
              width={50}
              height={50}
              borderRadius={25}
              bg="rgba(0, 0, 0, 0.5)"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="#FFFFFF" fontSize={20}>🔄</Text>
            </Box>
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 60, // Android'de tab bar yüksekliği için daha fazla padding
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1000, // Tab bar'ın üzerinde görünmesi için yüksek z-index
  },
  galleryButton: {
    width: 50,
    height: 50,
  },
  lastPhotoPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shutterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  shutterButtonDisabled: {
    opacity: 0.5,
  },
  flipButton: {
    width: 50,
    height: 50,
  },
});

