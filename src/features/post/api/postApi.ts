import { apiService } from '@/src/services/ApiService';
import type { CreatePostRequest, CreatePostResponse, ApiContextType } from '../types';

/**
 * Boost Option - Question post için boost seçeneği
 */
export interface BoostOption {
  id: string;              // Boost option ID (UUID)
  image: string;           // Boost option görseli
  title: string;           // Boost option başlığı
  description: string;      // Boost option açıklaması
  amount: number;          // Boost miktarı (TIPS)
  isPopular: boolean;      // Popüler boost option mu?
}

/**
 * Get Boost Options endpoint function
 * Question post için kullanılabilir boost option'ları getirir
 * 
 * @returns BoostOption[] - Boost option listesi
 */
export const getBoostOptions = async (): Promise<BoostOption[]> => {
  try {
    const response = await apiService.getClient().get<BoostOption[]>(
      '/posts/boost-options'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getBoostOptions] API Error:', {
      url: '/posts/boost-options',
      method: 'GET',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

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
  try {
    console.log('[createQuestionPost] Request data:', {
      contextType: data.contextType,
      contextId: data.contextId,
      description: data.description?.substring(0, 50) + '...',
      selectedBoostOptionId: data.selectedBoostOptionId,
      imagesCount: data.images?.length || 0,
    });
    
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
    
    console.log('[createQuestionPost] Request URL: POST /posts/question');
    console.log('[createQuestionPost] FormData fields:', {
      contextType: data.contextType,
      contextId: data.contextId,
      description: data.description?.substring(0, 50) + '...',
      selectedBoostOptionId: data.selectedBoostOptionId,
      imagesCount: data.images?.length || 0,
    });
    
    const response = await client.post<CreatePostResponse>(
      '/posts/question',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('[createQuestionPost] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[createQuestionPost] ❌ API Error:', {
      url: '/posts/question',
      method: 'POST',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: {
        contextType: data.contextType,
        contextId: data.contextId,
        description: data.description?.substring(0, 50) + '...',
        selectedBoostOptionId: data.selectedBoostOptionId,
        imagesCount: data.images?.length || 0,
      },
      responseData: error.response?.data,
      errorMessage: error.message,
    });
    throw error;
  }
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
  try {
    console.log('[createExperiencePost] Request data:', {
      contextType: data.contextType,
      contextId: data.contextId,
      selectedDurationId: data.selectedDurationId,
      selectedLocationId: data.selectedLocationId,
      selectedPurposeId: data.selectedPurposeId,
      content: data.content?.substring(0, 50) + '...',
      experience: data.experience,
      status: data.status,
      experienceSnippetId: data.experienceSnippetId,
      imagesCount: data.images?.length || 0,
    });
    
    // Zorunlu alan kontrolü
    if (!data.selectedDurationId || data.selectedDurationId.trim() === '') {
      throw new Error('selectedDurationId is required and cannot be empty');
    }
    if (!data.selectedLocationId || data.selectedLocationId.trim() === '') {
      throw new Error('selectedLocationId is required and cannot be empty');
    }
    if (!data.selectedPurposeId || data.selectedPurposeId.trim() === '') {
      throw new Error('selectedPurposeId is required and cannot be empty');
    }
    
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
    
    console.log('[createExperiencePost] Request URL: POST /posts/experience');
    console.log('[createExperiencePost] FormData fields:', {
      contextType: data.contextType,
      contextId: data.contextId,
      selectedDurationId: data.selectedDurationId,
      selectedLocationId: data.selectedLocationId,
      selectedPurposeId: data.selectedPurposeId,
      content: data.content?.substring(0, 50) + '...',
      experience: JSON.stringify(data.experience),
      status: data.status,
      experienceSnippetId: data.experienceSnippetId,
      imagesCount: data.images?.length || 0,
    });
    
    const response = await client.post<CreatePostResponse>(
      '/posts/experience',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    console.log('[createExperiencePost] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[createExperiencePost] ❌ API Error:', {
      url: '/posts/experience',
      method: 'POST',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: {
        contextType: data.contextType,
        contextId: data.contextId,
        selectedDurationId: data.selectedDurationId,
        selectedLocationId: data.selectedLocationId,
        selectedPurposeId: data.selectedPurposeId,
        content: data.content?.substring(0, 50) + '...',
        experience: data.experience,
        status: data.status,
        experienceSnippetId: data.experienceSnippetId,
        imagesCount: data.images?.length || 0,
      },
      responseData: error.response?.data,
      errorMessage: error.message,
    });
    throw error;
  }
};

/**
 * Split Experience Request Body
 * Gemini AI ile deneyim metnini kategorilere ayırmak için
 */
export interface SplitExperienceRequest {
  productId: string;
  content: string;
}

/**
 * Split Experience Response
 * AI'dan dönen split edilmiş deneyim bilgileri
 */
export interface SplitExperienceResponse {
  experienceSnippetId: string;
  priceAndShopping: {
    content: string;
    rating: number;
    placeholder?: string | null;
    isEnhanced?: boolean;
  } | null;
  productAndUsage: {
    content: string;
    rating: number;
    placeholder?: string | null;
    isEnhanced?: boolean;
  } | null;
  metadata: {
    tokensUsed: number | null;
    processingTimeMs: number;
    model: string;
    promptVersion: string;
  };
}

/**
 * Split Experience endpoint function
 * Gemini AI ile deneyim metnini kategorilere ayırır
 * 
 * @param data - Split Experience request data
 * @returns SplitExperienceResponse - AI'dan dönen split edilmiş deneyim bilgileri
 */
export const splitExperience = async (
  data: SplitExperienceRequest
): Promise<SplitExperienceResponse> => {
  try {
    console.log('[splitExperience] Request data:', JSON.stringify(data, null, 2));
    console.log('[splitExperience] Request URL: POST /posts/experience/split');
    
    // AI işlemleri için timeout'u 60 saniyeye çıkar (default: 10 saniye)
    const response = await apiService.getClient().post<SplitExperienceResponse>(
      '/posts/experience/split',
      data,
      {
        timeout: 60000, // 60 saniye - AI işlemleri daha uzun sürebilir
      }
    );
    
    console.log('[splitExperience] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[splitExperience] ❌ API Error:', {
      url: '/posts/experience/split',
      method: 'POST',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: data,
      responseData: error.response?.data,
      errorMessage: error.message,
      isTimeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
    });
    
    throw error;
  }
};

