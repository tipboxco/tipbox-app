import * as ImagePicker from 'expo-image-picker';
import { imagePickerConfig } from '../../config/imagePicker.config';
import type { IImagePickerService, ImagePickerResult, ImageValidationResult } from './types';

class ExpoImagePickerService implements IImagePickerService {
  private static instance: ExpoImagePickerService;

  private constructor() {}

  public static getInstance(): ExpoImagePickerService {
    if (!ExpoImagePickerService.instance) {
      ExpoImagePickerService.instance = new ExpoImagePickerService();
    }
    return ExpoImagePickerService.instance;
  }

  private async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  private async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  public validateImage(asset: ImagePicker.ImagePickerAsset): ImageValidationResult {
    // Dosya boyutu kontrolü
    if (asset.fileSize && asset.fileSize > imagePickerConfig.maxFileSize) {
      return {
        isValid: false,
        error: 'Dosya boyutu çok büyük (max 5MB)',
      };
    }

    // Dosya tipi kontrolü
    if (asset.mimeType && !imagePickerConfig.allowedTypes.includes(asset.mimeType)) {
      return {
        isValid: false,
        error: 'Desteklenmeyen dosya formatı (sadece JPEG ve PNG)',
      };
    }

    return { isValid: true };
  }

  public async pickFromCamera(): Promise<ImagePickerResult> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Kamera izni verilmedi',
        };
      }

      const result = await ImagePicker.launchCameraAsync(imagePickerConfig.camera);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'Fotoğraf çekilmedi',
        };
      }

      const asset = result.assets[0];
      const validation = this.validateImage(asset);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      return {
        success: true,
        asset,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Fotoğraf çekilirken bir hata oluştu',
      };
    }
  }

  public async pickFromGallery(): Promise<ImagePickerResult> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Galeri izni verilmedi',
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync(imagePickerConfig.gallery);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'Fotoğraf seçilmedi',
        };
      }

      const asset = result.assets[0];
      const validation = this.validateImage(asset);

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      return {
        success: true,
        asset,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Fotoğraf seçilirken bir hata oluştu',
      };
    }
  }
}

export const imagePickerService = ExpoImagePickerService.getInstance();
export * from './types'; 