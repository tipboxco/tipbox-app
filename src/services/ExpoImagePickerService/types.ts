import { ImagePickerAsset } from 'expo-image-picker';

export interface ImagePickerResult {
  success: boolean;
  error?: string;
  asset?: ImagePickerAsset;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IImagePickerService {
  pickFromCamera: () => Promise<ImagePickerResult>;
  pickFromGallery: () => Promise<ImagePickerResult>;
  validateImage: (asset: ImagePickerAsset) => ImageValidationResult;
} 