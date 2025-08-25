import { ImagePickerOptions } from 'expo-image-picker';

export const imagePickerConfig = {
  camera: {
    mediaTypes: 'Images' as const,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: 0.7,
    base64: false,
    exif: false,
    cropperCircleOverlay: true, // Yuvarlak crop overlay
    useFrontCamera: true, // Ön kamera kullan
  } satisfies ImagePickerOptions,

  gallery: {
    mediaTypes: 'Images' as const,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: 0.7,
    allowsMultipleSelection: false,
    base64: false,
    exif: false,
    cropperCircleOverlay: true, // Yuvarlak crop overlay
  } satisfies ImagePickerOptions,

  // Yükleme limitleri
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
} as const;

export type ImagePickerConfig = typeof imagePickerConfig; 