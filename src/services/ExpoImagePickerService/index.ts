import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { imagePickerConfig } from '../../config/imagePicker.config';
import type { IImagePickerService, ImagePickerResult, ImagePickerMultipleResult, ImageValidationResult } from './types';

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
    // Dosya boyutu kontrolü - sadece bu kontrolü yap
    // Expo Image Picker zaten MediaType.Images kullandığımız için sadece görsel dosyaları seçebilir
    if (asset.fileSize && asset.fileSize > imagePickerConfig.maxFileSize) {
      const maxSizeMB = Math.round(imagePickerConfig.maxFileSize / (1024 * 1024));
      return {
        isValid: false,
        error: `Dosya boyutu çok büyük (max ${maxSizeMB}MB)`,
      };
    }

    // Expo Image Picker MediaType.Images kullandığı için tüm görsel formatları desteklenir
    // Ekstra format kontrolü gerekmez
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

      const originalAsset = result.assets[0];
      
      try {
        // Görseli JPEG formatına dönüştür (tüm formatları desteklemek için)
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          originalAsset.uri,
          [], // No transformations - sadece format dönüşümü
          {
            compress: 0.9, // Yüksek kalite
            format: ImageManipulator.SaveFormat.JPEG, // JPEG formatına dönüştür
          }
        );

        // Dönüştürülmüş görseli yeni asset olarak oluştur
        const convertedAsset: ImagePicker.ImagePickerAsset = {
          ...originalAsset,
          uri: manipulatedImage.uri,
          mimeType: 'image/jpeg',
          fileSize: manipulatedImage.width && manipulatedImage.height 
            ? Math.round((manipulatedImage.width * manipulatedImage.height * 3) / 1024)
            : originalAsset.fileSize,
        };

        const validation = this.validateImage(convertedAsset);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      return {
        success: true,
          asset: convertedAsset,
        };
      } catch (conversionError: any) {
        console.warn('Image conversion error:', conversionError);
        // Dönüşüm başarısız olursa orijinal asset'i kullanmayı dene
        const validation = this.validateImage(originalAsset);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error || 'Görsel işlenemedi',
          };
        }
        return {
          success: true,
          asset: originalAsset,
      };
      }
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

      const originalAsset = result.assets[0];
      
      try {
        // Görseli JPEG formatına dönüştür (tüm formatları desteklemek için)
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          originalAsset.uri,
          [], // No transformations - sadece format dönüşümü
          {
            compress: 0.9, // Yüksek kalite
            format: ImageManipulator.SaveFormat.JPEG, // JPEG formatına dönüştür
          }
        );

        // Dönüştürülmüş görseli yeni asset olarak oluştur
        const convertedAsset: ImagePicker.ImagePickerAsset = {
          ...originalAsset,
          uri: manipulatedImage.uri,
          mimeType: 'image/jpeg',
          fileSize: manipulatedImage.width && manipulatedImage.height 
            ? Math.round((manipulatedImage.width * manipulatedImage.height * 3) / 1024)
            : originalAsset.fileSize,
        };

        const validation = this.validateImage(convertedAsset);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      return {
        success: true,
          asset: convertedAsset,
        };
      } catch (conversionError: any) {
        console.warn('Image conversion error:', conversionError);
        // Dönüşüm başarısız olursa orijinal asset'i kullanmayı dene
        const validation = this.validateImage(originalAsset);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error || 'Görsel işlenemedi',
          };
        }
        return {
          success: true,
          asset: originalAsset,
      };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Fotoğraf seçilirken bir hata oluştu',
      };
    }
  }

  public async pickMultipleFromGallery(maxSelection: number = 10): Promise<ImagePickerMultipleResult> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Galeri izni verilmedi',
        };
      }

      // iOS'ta format sorunlarını önlemek için özel ayarlar
      const pickerOptions = {
        ...imagePickerConfig.galleryMultiple,
        selectionLimit: maxSelection,
        // iOS'ta HEIC/HEIF formatlarını desteklemek için
        quality: 1, // Maximum quality - format dönüşümü sorunlarını önler
      };

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled) {
        return {
          success: false,
          error: 'Fotoğraf seçimi iptal edildi',
        };
      }

      if (!result.assets || result.assets.length === 0) {
        return {
          success: false,
          error: 'Fotoğraf seçilmedi',
        };
      }

      // Tüm asset'leri işle - iOS'ta format sorunlarını önlemek için manipulator'ı sadece gerektiğinde kullan
      const validAssets: ImagePicker.ImagePickerAsset[] = [];
      const invalidAssets: string[] = [];
      
      for (const asset of result.assets) {
        // URI kontrolü - URI yoksa atla
        if (!asset.uri) {
          invalidAssets.push('Görsel URI bulunamadı');
          console.warn('Asset URI is missing:', asset);
          continue;
        }

        try {
          // iOS'ta format sorunlarını önlemek için manipulator'ı sadece gerektiğinde kullan
          // Eğer görsel zaten JPEG/PNG formatındaysa manipulator kullanma
          const uriLower = asset.uri.toLowerCase();
          const mimeTypeLower = (asset.mimeType || '').toLowerCase();
          
          const isAlreadyStandardFormat = 
            uriLower.endsWith('.jpg') || 
            uriLower.endsWith('.jpeg') || 
            uriLower.endsWith('.png') ||
            mimeTypeLower === 'image/jpeg' ||
            mimeTypeLower === 'image/png';

          let finalAsset: ImagePicker.ImagePickerAsset = asset;

          // iOS'ta manipulator sorun çıkarabildiği için iOS'ta manipulator kullanma
          // Expo Image Picker zaten görsel formatlarını destekliyor
          // Backend'e gönderirken format dönüşümü backend tarafında yapılabilir
          if (!isAlreadyStandardFormat && Platform.OS !== 'ios') {
            // Sadece Android'de manipulator kullan (iOS'ta sorun çıkarabiliyor)
            try {
              const manipulatedImage = await ImageManipulator.manipulateAsync(
                asset.uri,
                [],
                {
                  compress: 0.9,
                  format: ImageManipulator.SaveFormat.JPEG,
                }
              );

              finalAsset = {
                ...asset,
                uri: manipulatedImage.uri,
                mimeType: 'image/jpeg',
                fileSize: manipulatedImage.width && manipulatedImage.height 
                  ? Math.round((manipulatedImage.width * manipulatedImage.height * 3) / 1024)
                  : asset.fileSize,
              };
            } catch (manipulatorError: any) {
              // Manipulator başarısız olursa orijinal asset'i kullan
              console.warn('Image manipulator failed, using original asset:', manipulatorError?.message);
              finalAsset = asset;
            }
          }
          // iOS'ta manipulator kullanma - orijinal asset'i direkt kullan
          // Expo Image Picker zaten tüm formatları destekliyor

          const validation = this.validateImage(finalAsset);
          if (validation.isValid) {
            validAssets.push(finalAsset);
          } else {
            invalidAssets.push(validation.error || 'Geçersiz dosya');
          }
        } catch (error: any) {
          console.error('Image processing error:', error, 'Original URI:', asset.uri);
          // Hata durumunda da orijinal asset'i kullanmayı dene
          try {
        const validation = this.validateImage(asset);
        if (validation.isValid) {
          validAssets.push(asset);
            } else {
              invalidAssets.push(validation.error || 'Görsel işlenemedi');
            }
          } catch {
            invalidAssets.push('Görsel işlenemedi');
          }
        }
      }

      // Eğer hiç geçerli asset yoksa hata döndür
      if (validAssets.length === 0) {
        const errorMessage = invalidAssets.length > 0 
          ? invalidAssets[0] 
          : 'Seçilen fotoğraflardan hiçbiri geçerli değil';
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Bazı asset'ler geçersizse uyarı ver ama geçerli olanları döndür
      if (invalidAssets.length > 0 && validAssets.length > 0) {
        console.warn(`Bazı görseller geçersiz ve atlandı: ${invalidAssets.join(', ')}`);
      }

      return {
        success: true,
        assets: validAssets,
      };
    } catch (error: any) {
      console.error('Image picker error details:', error);
      
      // iOS'ta özel hata mesajları
      let errorMessage = 'Fotoğraf seçilirken bir hata oluştu';
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        
        // iOS'ta format hatası
        if (errorMsg.includes('cannot load representation') || errorMsg.includes('public.jpeg') || errorMsg.includes('public.heic')) {
          errorMessage = 'Görsel formatı desteklenmiyor. Lütfen farklı bir görsel seçin veya görseli JPEG/PNG formatına dönüştürün.';
        } else if (errorMsg.includes('permission') || errorMsg.includes('authorization')) {
          errorMessage = 'Galeri erişim izni gerekli. Lütfen ayarlardan izin verin.';
        } else if (errorMsg.includes('canceled') || errorMsg.includes('cancelled')) {
          errorMessage = 'Görsel seçimi iptal edildi';
        } else {
          errorMessage = `Fotoğraf seçilirken bir hata oluştu: ${error.message}`;
        }
      } else if (error?.toString) {
        errorMessage = `Fotoğraf seçilirken bir hata oluştu: ${error.toString()}`;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const imagePickerService = ExpoImagePickerService.getInstance();
export * from './types'; 