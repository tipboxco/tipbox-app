import { apiService } from '@/src/services/ApiService';
import type { CreatePostRequest, CreatePostResponse } from '../types';

/**
 * Create Free Post endpoint function
 * Sub Category, Product Group veya Product için serbest gönderi oluşturur
 *
 * @param data - Post creation data
 * @returns CreatePostResponse - Created post response
 */
export const createFreePost = async (
  data: CreatePostRequest
): Promise<CreatePostResponse> => {
  const client = apiService.getClient();
  
  // FormData oluştur (multipart/form-data için)
  const formData = new FormData();
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  formData.append('description', data.description);
  
  // Images varsa ekle
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      // React Native'de FormData için image object formatı
      // iOS'ta URI'ler ph:// veya assets-library:// ile başlayabilir ve uzantı içermeyebilir
      // Bu durumda varsayılan olarak JPEG kullan
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
      // URI'den dosya uzantısını çıkar (eğer varsa)
      const uriLower = imageUri.toLowerCase();
      if (uriLower.includes('.')) {
        const ext = imageUri.split('.').pop()?.toLowerCase();
        if (ext === 'png') {
          fileExtension = 'png';
          mimeType = 'image/png';
        } else if (ext === 'jpg' || ext === 'jpeg') {
          fileExtension = 'jpg';
          mimeType = 'image/jpeg';
        }
      }
      // iOS'ta ph:// veya assets-library:// URI'leri için varsayılan JPEG kullan
      // Expo Image Picker zaten görsel formatlarını destekliyor
      
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      } as any);
    });
  }
  
  const response = await client.post<CreatePostResponse>(
    '/posts/free',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

