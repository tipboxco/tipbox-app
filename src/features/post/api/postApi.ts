import { apiService } from '@/src/services/ApiService';
import type { CreatePostRequest, CreatePostResponse, ApiContextType } from '../types';

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

/**
 * Create Benchmark Post Request Body
 */
export interface CreateBenchmarkPostRequest {
  contextType: ApiContextType;
  contextId: string;
  description: string;
  products: Array<{
    productId: string;
    isSelected: boolean;
  }>;
  images?: string[];
}

/**
 * Create Benchmark Post endpoint function
 * Ürün karşılaştırması (benchmark) gönderisi oluşturur
 *
 * @param data - Benchmark post creation data
 * @returns CreatePostResponse - Created post response
 */
export const createBenchmarkPost = async (
  data: CreateBenchmarkPostRequest
): Promise<CreatePostResponse> => {
  const client = apiService.getClient();
  
  // FormData oluştur (multipart/form-data için)
  const formData = new FormData();
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  formData.append('description', data.description);
  
  // Products array'ini JSON string olarak ekle
  formData.append('products', JSON.stringify(data.products));
  
  // Images varsa ekle
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
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
      
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      } as any);
    });
  }
  
  const response = await client.post<CreatePostResponse>(
    '/posts/benchmark',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Create Tips & Tricks Post Request Body
 */
export interface CreateTipsAndTricksPostRequest {
  contextType: ApiContextType;
  contextId: string;
  description: string;
  benefitCategory: 'time_saving' | 'energy_efficiency' | 'durability' | 'better_result';
  images?: string[];
}

/**
 * Create Tips & Tricks Post endpoint function
 * Tips & tricks gönderisi oluşturur
 */
export const createTipsAndTricksPost = async (
  data: CreateTipsAndTricksPostRequest
): Promise<CreatePostResponse> => {
  const client = apiService.getClient();
  
  const formData = new FormData();
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  formData.append('description', data.description);
  formData.append('benefitCategory', data.benefitCategory);
  
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
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
      
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      } as any);
    });
  }
  
  const response = await client.post<CreatePostResponse>(
    '/posts/tips-and-tricks',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Create Question Post Request Body
 */
export interface CreateQuestionPostRequest {
  contextType: ApiContextType;
  contextId: string;
  description: string;
  selectedBoostOptionId: string;
  images?: string[];
}

/**
 * Create Question Post endpoint function
 * Soru gönderisi oluşturur
 */
export const createQuestionPost = async (
  data: CreateQuestionPostRequest
): Promise<CreatePostResponse> => {
  const client = apiService.getClient();
  
  const formData = new FormData();
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  formData.append('description', data.description);
  formData.append('selectedBoostOptionId', data.selectedBoostOptionId);
  
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
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
      
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      } as any);
    });
  }
  
  const response = await client.post<CreatePostResponse>(
    '/posts/question',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Create Update Post Request Body
 */
export interface CreateUpdatePostRequest {
  contextType: ApiContextType;
  contextId: string;
  content: string; // "description" değil, "content"!
  images?: string[];
}

/**
 * Create Update Post endpoint function
 * Update gönderisi oluşturur
 */
export const createUpdatePost = async (
  data: CreateUpdatePostRequest
): Promise<CreatePostResponse> => {
  const client = apiService.getClient();
  
  const formData = new FormData();
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  formData.append('content', data.content); // "description" değil, "content"!
  
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
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
      
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      } as any);
    });
  }
  
  const response = await client.post<CreatePostResponse>(
    '/posts/update',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

/**
 * Create Experience Post Request Body
 */
export interface CreateExperiencePostRequest {
  contextType: ApiContextType;
  contextId: string;
  selectedDurationId: string;
  selectedLocationId: string;
  selectedPurposeId: string;
  content: string;
  experience: Array<{
    type: 'price_and_shopping' | 'product_and_usage';
    content: string;
    rating: number;
  }>;
  status: 'own' | 'tested';
  images?: string[];
  experienceSnippetId?: string;
}

/**
 * Create Experience Post endpoint function
 * Deneyim gönderisi oluşturur
 */
export const createExperiencePost = async (
  data: CreateExperiencePostRequest
): Promise<CreatePostResponse> => {
  const client = apiService.getClient();
  
  const formData = new FormData();
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  formData.append('selectedDurationId', data.selectedDurationId);
  formData.append('selectedLocationId', data.selectedLocationId);
  formData.append('selectedPurposeId', data.selectedPurposeId);
  formData.append('content', data.content);
  formData.append('experience', JSON.stringify(data.experience));
  formData.append('status', data.status);
  
  if (data.experienceSnippetId) {
    formData.append('experienceSnippetId', data.experienceSnippetId);
  }
  
  if (data.images && data.images.length > 0) {
    data.images.forEach((imageUri, index) => {
      let fileExtension = 'jpg';
      let mimeType = 'image/jpeg';
      
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
      
      formData.append('images', {
        uri: imageUri,
        type: mimeType,
        name: `image_${index}.${fileExtension}`,
      } as any);
    });
  }
  
  const response = await client.post<CreatePostResponse>(
    '/posts/experience',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

