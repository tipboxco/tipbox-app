import { ImagePickerOptions } from 'expo-image-picker';

export const imagePickerConfig = {
  camera: {
    mediaTypes: 'Images' as const,
    allowsEditing: true,
    aspect: [4, 3] as [number, number],
    quality: 0.7,
    base64: false,
  } satisfies ImagePickerOptions,

  gallery: {
    mediaTypes: 'Images' as const,
    allowsEditing: true,
    aspect: [4, 3] as [number, number],
    quality: 0.7,
    allowsMultipleSelection: false,
    base64: false,
  } satisfies ImagePickerOptions,

  // Yükleme limitleri
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
} as const;

export type ImagePickerConfig = typeof imagePickerConfig; 