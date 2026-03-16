import { ImagePickerOptions } from 'expo-image-picker';

export const imagePickerConfig = {
  camera: {
    mediaTypes: 'images' as const,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: 0.7,
    base64: false,
    exif: false,
  } satisfies ImagePickerOptions,

  gallery: {
    mediaTypes: 'images' as const,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: 0.7,
    allowsMultipleSelection: false,
    base64: false,
    exif: false,
    // allowsEditing: true → legacy UIImagePickerController kullanır,
    // preferredAssetRepresentationMode bu picker'da etkisiz.
  } satisfies ImagePickerOptions,

  galleryMultiple: {
    mediaTypes: 'images' as const,
    allowsEditing: false, // Multiple selection'da editing kapalı
    // quality: 1 + preferredAssetRepresentationMode: 'current' (default) →
    // Native kodda fast path'i tetikler. Fast path loadFileRepresentation
    // kullanır (güvenilir). Slow path ise loadDataRepresentation kullanır
    // ve "Cannot load representation of type public.png/heic" hatasına yol açar.
    // Kalite sıkıştırması JS tarafında ImageManipulator ile yapılır.
    quality: 1,
    allowsMultipleSelection: true,
    base64: false,
    exif: false,
    // preferredAssetRepresentationMode: default 'current' (fast path için gerekli)
  } satisfies ImagePickerOptions,

  // Yükleme limitleri
  maxFileSize: 10 * 1024 * 1024, // 10MB (artırıldı)
  // Tüm görsel formatlarını destekle
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/bmp',
    'image/tiff',
  ],
} as const;

export type ImagePickerConfig = typeof imagePickerConfig; 