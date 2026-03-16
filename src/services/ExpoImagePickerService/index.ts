import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, AppState, Linking } from 'react-native';
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

  private waitForPermissionAfterSettings(
    checkPermission: () => Promise<boolean>,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const subscription = AppState.addEventListener('change', async (nextState) => {
        if (nextState === 'active') {
          subscription.remove();
          const granted = await checkPermission();
          resolve(granted);
        }
      });
    });
  }

  private showPermissionAlertAndWait(
    title: string,
    message: string,
    checkPermission: () => Promise<boolean>,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: 'İptal', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Ayarlara Git',
            onPress: async () => {
              Linking.openSettings();
              const granted = await this.waitForPermissionAfterSettings(checkPermission);
              resolve(granted);
            },
          },
        ],
      );
    });
  }

  private async requestCameraPermission(): Promise<boolean> {
    const { status: currentStatus } = await ImagePicker.getCameraPermissionsAsync();

    if (currentStatus === 'granted') return true;

    // Daha önce reddedildiyse direkt Ayarlara Git alertı göster
    if (currentStatus === 'denied') {
      return this.showPermissionAlertAndWait(
        'Kamera Erişimi Gerekli',
        'Kamera kullanabilmek için ayarlardan izin vermeniz gerekmektedir.',
        async () => {
          const { status } = await ImagePicker.getCameraPermissionsAsync();
          return status === 'granted';
        },
      );
    }

    // İlk kez isteniyor (undetermined) - sistem dialogunu göster
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') return true;

    // Kullanıcı sistem dialogunda reddetti - hemen Ayarlara Git alertı göster
    return this.showPermissionAlertAndWait(
      'Kamera Erişimi Gerekli',
      'Kamera kullanabilmek için ayarlardan izin vermeniz gerekmektedir.',
      async () => {
        const { status: recheckStatus } = await ImagePicker.getCameraPermissionsAsync();
        return recheckStatus === 'granted';
      },
    );
  }

  private async requestMediaLibraryPermission(): Promise<boolean> {
    const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (currentStatus === 'granted') return true;

    // Daha önce reddedildiyse direkt Ayarlara Git alertı göster
    if (currentStatus === 'denied') {
      return this.showPermissionAlertAndWait(
        'Galeri Erişimi Gerekli',
        'Galeriye erişebilmek için ayarlardan izin vermeniz gerekmektedir.',
        async () => {
          const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
          return status === 'granted';
        },
      );
    }

    // İlk kez isteniyor (undetermined) - sistem dialogunu göster
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') return true;

    // Kullanıcı sistem dialogunda reddetti - hemen Ayarlara Git alertı göster
    return this.showPermissionAlertAndWait(
      'Galeri Erişimi Gerekli',
      'Galeriye erişebilmek için ayarlardan izin vermeniz gerekmektedir.',
      async () => {
        const { status: recheckStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
        return recheckStatus === 'granted';
      },
    );
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

      // Tüm asset'leri JPEG'e dönüştür (native picker quality:1 ile ham dosya veriyor,
      // sıkıştırma ve format dönüşümü burada yapılıyor)
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
          // Tüm görselleri ImageManipulator ile JPEG'e dönüştür ve sıkıştır.
          // Native picker fast path ile ham dosyayı kopyalar (HEIC/PNG/JPEG vb.),
          // format dönüşümü ve kalite sıkıştırması burada yapılır.
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            [], // No transformations - sadece format dönüşümü
            {
              compress: 0.9,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          const finalAsset: ImagePicker.ImagePickerAsset = {
            ...asset,
            uri: manipulatedImage.uri,
            mimeType: 'image/jpeg',
            fileSize: manipulatedImage.width && manipulatedImage.height
              ? Math.round((manipulatedImage.width * manipulatedImage.height * 3) / 1024)
              : asset.fileSize,
          };

          const validation = this.validateImage(finalAsset);
          if (validation.isValid) {
            validAssets.push(finalAsset);
          } else {
            invalidAssets.push(validation.error || 'Geçersiz dosya');
          }
        } catch (manipulatorError: any) {
          console.warn('Image manipulator failed, trying original asset:', manipulatorError?.message);

          // Manipulator başarısız olursa orijinal asset'i kullanmayı dene
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
        
        // iOS'ta format hatası (HEIC/HEIF/PNG representation)
        if (errorMsg.includes('cannot load representation') ||
            errorMsg.includes('public.heic') ||
            errorMsg.includes('public.heif') ||
            errorMsg.includes('public.png') ||
            errorMsg.includes('heic') ||
            errorMsg.includes('heif')) {
          errorMessage = 'Görsel formatı okunamadı. Lütfen farklı bir görsel seçin veya görseli önceden JPEG formatına dönüştürün.';
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