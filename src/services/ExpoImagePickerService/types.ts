import { ImagePickerAsset } from 'expo-image-picker';

export interface ImagePickerResult {
  success: boolean;
  error?: string;
  asset?: ImagePickerAsset;
}

export interface ImagePickerMultipleResult {
  success: boolean;
  error?: string;
  assets?: ImagePickerAsset[];
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IImagePickerService {
  pickFromCamera: () => Promise<ImagePickerResult>;
  pickFromGallery: () => Promise<ImagePickerResult>;
  pickMultipleFromGallery: (maxSelection?: number) => Promise<ImagePickerMultipleResult>;
  validateImage: (asset: ImagePickerAsset) => ImageValidationResult;
} 