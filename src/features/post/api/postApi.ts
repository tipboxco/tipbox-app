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
    console.log('[getBoostOptions] 📡 Fetching boost options...');
    const response = await apiService.getClient().get<BoostOption[]>(
      '/posts/boost-options'
    );
    console.log('[getBoostOptions] ✅ Success:', {
      count: response.data.length,
      options: response.data.map(opt => ({ id: opt.id, title: opt.title, amount: opt.amount })),
    });
    return response.data;
  } catch (error: any) {
    console.error('[getBoostOptions] ❌ API Error:', {
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
  
  console.log('[postApi] createFreePost - Input data:', {
    contextType: data.contextType,
    contextId: data.contextId,
    description: data.description,
    images: data.images?.length || 0,
    eventId: data.eventId,
  });
  
  // FormData oluştur (multipart/form-data için)
  const formData = new FormData();
  formData.append('contextType', data.contextType);
  formData.append('contextId', data.contextId);
  formData.append('description', data.description);
  
  console.log('[postApi] createFreePost - FormData fields:', {
    contextType: data.contextType,
    contextId: data.contextId,
    description: data.description,
  });
  
  // Event ID varsa ekle (event'e bağlı post için)
  if (data.eventId) {
    formData.append('eventId', data.eventId);
  }
  
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
        'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
      },
    }
  );
  
  console.log('[postApi] createFreePost - Backend Response:', response.data);
  
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

  // Backend sadece "product" (küçük harf) kabul eder; büyük harf 400 döner
  const contextType = String(data.contextType ?? 'product').toLowerCase();

  const formData = new FormData();
  formData.append('contextType', contextType);
  formData.append('contextId', data.contextId);
  formData.append('description', data.description);

  // Products array'ini JSON string olarak ekle (her iki üründe isSelected: true olmalı)
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
        'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
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
  try {
    // Validate contextId is not empty
    if (!data.contextId || data.contextId.trim() === '') {
      console.error('[createTipsAndTricksPost] ❌ Empty contextId');
      throw new Error('contextId cannot be empty');
    }
    
    console.log('[createTipsAndTricksPost] 📤 Request data:', {
      contextType: data.contextType,
      contextId: data.contextId,
      contextIdLength: data.contextId?.length || 0,
      description: data.description?.substring(0, 50) + '...',
      descriptionLength: data.description?.length || 0,
      benefitCategory: data.benefitCategory,
      imagesCount: data.images?.length || 0,
    });
    
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
    
    console.log('[createTipsAndTricksPost] 📤 FormData prepared:', {
      hasContextType: !!formData.get('contextType'),
      hasContextId: !!formData.get('contextId'),
      hasDescription: !!formData.get('description'),
      hasBenefitCategory: !!formData.get('benefitCategory'),
      imagesCount: data.images?.length || 0,
    });
    
    const response = await client.post<CreatePostResponse>(
      '/posts/tips-and-tricks',
      formData,
      {
        headers: {
          'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
        },
      }
    );
    
    console.log('[createTipsAndTricksPost] ✅ Backend Response:', response.data);
    console.log('[createTipsAndTricksPost] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    const errorDetails = {
      url: '/posts/tips-and-tricks',
      method: 'POST',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: {
        contextType: data.contextType,
        contextId: data.contextId,
        contextIdLength: data.contextId?.length || 0,
        descriptionLength: data.description?.length || 0,
        benefitCategory: data.benefitCategory,
        imagesCount: data.images?.length || 0,
      },
      responseData: error.response?.data,
      responseMessage: error.response?.data?.message,
      responseError: error.response?.data?.error,
      errorMessage: error.message,
      errorStack: error.stack,
    };
    
    console.error('[createTipsAndTricksPost] ❌ API Error:', errorDetails);
    
    // Backend'den gelen detaylı hata mesajını logla
    if (error.response?.data) {
      console.error('[createTipsAndTricksPost] ❌ Backend Error Details:', {
        message: error.response.data.message,
        error: error.response.data.error,
        statusCode: error.response.data.statusCode,
        data: error.response.data,
      });
    }
    
    throw error;
  }
};

/**
 * Create Question Post Request Body
 */
export interface CreateQuestionPostRequest {
  contextType: ApiContextType;
  contextId: string;
  description: string;
  boostEnabled: boolean; // Boost ON/OFF
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
      boostEnabled: data.boostEnabled,
      imagesCount: data.images?.length || 0,
    });
    
    const client = apiService.getClient();
    
    const formData = new FormData();
    formData.append('contextType', data.contextType);
    formData.append('contextId', data.contextId);
    formData.append('description', data.description);
    formData.append('boostEnabled', String(data.boostEnabled)); // Boolean olarak gönder
    
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
      boostEnabled: data.boostEnabled,
      imagesCount: data.images?.length || 0,
    });
    
    const response = await client.post<CreatePostResponse>(
      '/posts/question',
      formData,
      {
        headers: {
          'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
        },
      }
    );
    
    console.log('[createQuestionPost] ✅ Backend Response:', response.data);
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
        boostEnabled: data.boostEnabled,
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
 * Backend'e göre experiencePostId ZORUNLU alan - Update post sadece experience post'lara eklenir
 */
export interface CreateUpdatePostRequest {
  contextType: ApiContextType;
  contextId: string;
  content: string;
  experiencePostId: string; // ZORUNLU - Update post sadece experience post'lara eklenir
  images?: string[];
  eventId?: string | null;
}

/**
 * Create Update Post endpoint function
 * Update gönderisi oluşturur
 */
export const createUpdatePost = async (
  data: CreateUpdatePostRequest
): Promise<CreatePostResponse> => {
  try {
    console.log('[createUpdatePost] 📤 Request data:', {
      contextType: data.contextType,
      contextId: data.contextId,
      experiencePostId: data.experiencePostId,
      contentLength: data.content?.length || 0,
      imagesCount: data.images?.length || 0,
      eventId: data.eventId,
    });

    // Backend'e göre experiencePostId ZORUNLU
    if (!data.experiencePostId || data.experiencePostId.trim() === '') {
      const errorMsg = 'experiencePostId is required for update posts';
      console.error(`[createUpdatePost] ❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Backend sadece 'product' contextType kabul ediyor
    if (data.contextType !== 'product') {
      console.warn(`[createUpdatePost] ⚠️ contextType '${data.contextType}' is not 'product', forcing to 'product'`);
    }

    const client = apiService.getClient();
    
    const formData = new FormData();
    formData.append('contextType', 'product'); // Backend sadece 'product' kabul ediyor
    formData.append('contextId', data.contextId || ''); // Opsiyonel - backend experience post'tan alır
    formData.append('content', data.content); // "description" değil, "content"!
    formData.append('experiencePostId', data.experiencePostId); // ZORUNLU alan
    
    if (data.eventId != null && data.eventId !== '') {
      formData.append('eventId', data.eventId);
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
  
    console.log('[createUpdatePost] 📤 FormData prepared:', {
      hasContextType: !!formData.get('contextType'),
      hasContextId: !!formData.get('contextId'),
      hasContent: !!formData.get('content'),
      hasExperiencePostId: !!formData.get('experiencePostId'),
      imagesCount: data.images?.length || 0,
    });

    const response = await client.post<CreatePostResponse>(
      '/posts/update',
      formData,
      {
        headers: {
          'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
        },
      }
    );
    
    console.log('[createUpdatePost] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[createUpdatePost] ❌ API Error:', {
      url: '/posts/update',
      method: 'POST',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: {
        contextType: data.contextType,
        contextId: data.contextId,
        experiencePostId: data.experiencePostId,
        contentLength: data.content?.length || 0,
        imagesCount: data.images?.length || 0,
      },
      responseData: error.response?.data,
      responseMessage: error.response?.data?.message,
      responseError: error.response?.data?.error,
      errorMessage: error.message,
    });
    throw error;
  }
};

/**
 * Experience Option - Backend'den dönen duration/location/purpose seçenekleri
 */
export interface ExperienceOption {
  id: string;
  name: string;
}

/**
 * Experience Options Response
 * GET /posts/experience/options endpoint'inden dönen veri
 */
export interface ExperienceOptionsResponse {
  durations: ExperienceOption[];
  locations: ExperienceOption[];
  purposes: ExperienceOption[];
}

/**
 * Get Experience Options endpoint function
 * Duration, Location ve Purpose seçeneklerini getirir
 *
 * @returns ExperienceOptionsResponse - Seçenek listeleri
 */
export const getExperienceOptions = async (): Promise<ExperienceOptionsResponse> => {
  try {
    const response = await apiService.getClient().get<ExperienceOptionsResponse>(
      '/posts/experience/options'
    );
    return response.data;
  } catch (error: any) {
    const baseURL = error.config?.baseURL ?? error.request?.config?.baseURL;
    console.error('[getExperienceOptions] ❌ API Error:', {
      url: '/posts/experience/options',
      fullUrl: baseURL ? `${baseURL.replace(/\/$/, '')}/posts/experience/options` : undefined,
      method: 'GET',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      errno: error.errno,
    });
    if (__DEV__ && error) {
      console.error('[getExperienceOptions] Full error:', error);
    }
    throw error;
  }
};

/**
 * Create Experience Post Request Body
 */
export interface CreateExperiencePostRequest {
  contextType: ApiContextType;
  contextId: string;
  productId?: string; // Required when contextType is sub_category or product_group
  experienceSnippetId: string;
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
  /** Opsiyonel. Etkinlik ile ilişkili post için event id. */
  eventId?: string | null;
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
    const hasImages = data.images && data.images.length > 0;

    if (!hasImages) {
      // Görsel yoksa application/json gönder. Backend bazen camelCase yerine snake_case bekliyor; her iki formatta gönder.
      const body = {
        contextType: data.contextType,
        contextId: data.contextId,
        content: data.content,
        experience: data.experience,
        status: data.status,
        experienceSnippetId: data.experienceSnippetId,
        // productId - Required when contextType is sub_category or product_group
        ...(data.productId && { productId: data.productId }),
        // camelCase (spec)
        selectedDurationId: data.selectedDurationId,
        selectedLocationId: data.selectedLocationId,
        selectedPurposeId: data.selectedPurposeId,
        // snake_case (bazı backend'ler bunu bekliyor)
        selected_duration_id: data.selectedDurationId,
        selected_location_id: data.selectedLocationId,
        selected_purpose_id: data.selectedPurposeId,
        // kısa isimler (bazı backend validation'ları bunları arıyor)
        duration: data.selectedDurationId,
        location: data.selectedLocationId,
        purpose: data.selectedPurposeId,
        ...(data.eventId != null && data.eventId !== '' ? { eventId: data.eventId } : {}),
      };
      console.log('[createExperiencePost] Request URL: POST /posts/experience (JSON)', {
        ...body,
        content: (body as { content?: string }).content?.substring(0, 50) + '...',
      });
      const response = await client.post<CreatePostResponse>('/posts/experience', body, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('[createExperiencePost] ✅ Success:', response.data);
      return response.data;
    }

    // Görsel varsa multipart/form-data
    const formData = new FormData();
    formData.append('contextType', data.contextType);
    formData.append('contextId', data.contextId);
    if (data.productId) {
      formData.append('productId', data.productId);
    }
    formData.append('content', data.content);
    formData.append('experience', JSON.stringify(data.experience));
    formData.append('status', data.status);
    formData.append('selectedDurationId', data.selectedDurationId);
    formData.append('selectedLocationId', data.selectedLocationId);
    formData.append('selectedPurposeId', data.selectedPurposeId);
    formData.append('experienceSnippetId', data.experienceSnippetId);
    if (data.eventId != null && data.eventId !== '') {
      formData.append('eventId', data.eventId);
    }
    data.images!.forEach((imageUri, index) => {
      const isUrl =
        imageUri.startsWith('http://') || imageUri.startsWith('https://');
      if (isUrl) {
        formData.append('images', imageUri);
      } else {
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
      }
    });

    console.log('[createExperiencePost] Request URL: POST /posts/experience (FormData)', {
      contextType: data.contextType,
      contextId: data.contextId,
      selectedDurationId: data.selectedDurationId,
      selectedLocationId: data.selectedLocationId,
      selectedPurposeId: data.selectedPurposeId,
      content: data.content?.substring(0, 50) + '...',
      experience: JSON.stringify(data.experience),
      status: data.status,
      imagesCount: data.images?.length || 0,
    });

    const response = await client.post<CreatePostResponse>(
      '/posts/experience',
      formData,
      {
        headers: {
          'Content-Type': undefined,
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
  experienceText: string;
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
    console.log('[splitExperience] Request URL: POST /inventory/split-experience');
    
    // AI işlemleri için timeout'u 60 saniyeye çıkar (default: 10 saniye)
    const response = await apiService.getClient().post<SplitExperienceResponse>(
      '/inventory/split-experience',
      data,
      {
        timeout: 60000, // 60 saniye - AI işlemleri daha uzun sürebilir
      }
    );
    
    console.log('[splitExperience] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[splitExperience] ❌ API Error:', {
      url: '/inventory/split-experience',
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

/**
 * Get Post Detail endpoint function
 * Post detayını getirir
 *
 * @param postId - Post ID'si
 * @returns Post detail response
 */
export interface PostDetailResponse {
  id: string;
  type: string;
  user: any;
  content: string;
  stats: any;
  images: any[];
  createdAt: string;
}

export const getPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  try {
    const response = await apiService.getClient().get<PostDetailResponse>(`/posts/${postId}`);
    return response.data;
  } catch (error: any) {
    console.error('[getPostDetail] API Error:', {
      url: `/posts/${postId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Update Post endpoint function
 * Post'u günceller
 *
 * @param postId - Post ID'si
 * @param data - Update data (content, images, etc.)
 * @returns Updated post response
 */
export interface UpdatePostRequest {
  content?: string;
  images?: string[];
}

export interface UpdatePostResponse {
  id: string;
  content: string;
  updatedAt: string;
}

export const updatePost = async (
  postId: string,
  data: UpdatePostRequest
): Promise<UpdatePostResponse> => {
  try {
    const response = await apiService.getClient().put<UpdatePostResponse>(
      `/posts/${postId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[updatePost] API Error:', {
      url: `/posts/${postId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: data,
    });
    throw error;
  }
};

/**
 * Delete Post endpoint function
 * Post'u siler
 *
 * @param postId - Post ID'si
 * @returns Success response
 */
export interface DeletePostResponse {
  success: boolean;
  message: string;
}

export const deletePost = async (postId: string): Promise<DeletePostResponse> => {
  console.log('[deletePost] 🗑️ Sending DELETE request to /posts/' + postId);
  
  try {
    const response = await apiService.getClient().delete<DeletePostResponse>(`/posts/${postId}`);
    
    console.log('[deletePost] ✅ Post deleted successfully:', {
      postId,
      response: response.data,
      status: response.status,
      timestamp: new Date().toISOString(),
    });
    
    return response.data;
  } catch (error: any) {
    console.error('[deletePost] ❌ API Error:', {
      postId,
      url: `/posts/${postId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Search Posts Response Interface
 * Backend'den dönen post search response formatı
 */
export interface SearchPostsResponse {
  items: Array<{
    type: 'feed';
    data: {
      id: string;
      title: string;
      body: string;
      user: {
        id: string;
        name: string;
        avatar: string | null;
      };
      createdAt: string;
    };
  }>;
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Search Posts endpoint function
 * Post başlığı veya içeriğinde arama yapar
 *
 * @param q - Arama terimi (required)
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns SearchPostsResponse - Post listesi ve pagination bilgisi
 */
export const searchPosts = async (
  q: string,
  cursor?: string,
  limit: number = 20
): Promise<SearchPostsResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('q', q);
    if (cursor) {
      params.append('cursor', cursor);
    }
    params.append('limit', Math.min(limit, 50).toString());

    const response = await apiService.getClient().get<SearchPostsResponse>(
      `/posts/search?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[searchPosts] API Error:', {
      url: `/posts/search?q=${q}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Dynamic Boost Price Request/Response
 * Question post için dinamik boost fiyatını getirir
 */
export interface GetBoostPriceResponse {
  price: number; // Dinamik boost fiyatı (TIPS)
  currency: string; // "TIPS"
  factors?: {
    onlineUsers?: number;
    activityLevel?: string;
    timeOfDay?: string;
  };
}

/** 404 durumunda kullanılan varsayılan boost fiyatı (backend endpoint yoksa veya route sırası yanlışsa) */
const BOOST_PRICE_FALLBACK: GetBoostPriceResponse = {
  price: 0,
  currency: 'TIPS',
};

/**
 * Get Dynamic Boost Price endpoint function
 * Platform aktivitesine göre güncel boost fiyatını döner.
 * 404 (Post not found) dönerse backend'de GET /posts/boost-price muhtemelen GET /posts/:postId'den sonra tanımlı;
 * bu durumda fallback fiyat dönülür, ekran kırılmaz.
 *
 * @returns GetBoostPriceResponse - Dinamik boost fiyat bilgisi
 */
export const getBoostPrice = async (): Promise<GetBoostPriceResponse> => {
  try {
    const response = await apiService.getClient().get<GetBoostPriceResponse>(
      '/posts/boost-price'
    );
    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 404 && message === 'Post not found') {
      // Backend'de route sırası: GET /posts/boost-price, GET /posts/:postId'den ÖNCE tanımlanmalı
      console.warn('[getBoostPrice] ⚠️ 404 Post not found – using fallback. Ensure backend route GET /posts/boost-price is defined before GET /posts/:postId.');
      return BOOST_PRICE_FALLBACK;
    }

    console.error('[getBoostPrice] ❌ API Error:', {
      url: '/posts/boost-price',
      method: 'GET',
      status,
      responseData: error.response?.data,
      errorMessage: error.message,
    });
    throw error;
  }
};
export interface ToggleBoostRequest {
  postId: string;
  enabled: boolean; // true: boost'u aç, false: boost'u kapat
}

export interface ToggleBoostResponse {
  success: boolean;
  postId: string;
  isBoosted: boolean;
  boostPrice?: number; // Backend'den dönen dinamik fiyat (kullanıcı aktivitesine göre)
  message?: string;
}

/**
 * Toggle Boost endpoint function
 * Question post için boost'u açar veya kapatır
 * Backend, kullanıcı aktivitesine göre dinamik bir fiyat döner
 *
 * @param data - Toggle boost request data
 * @returns ToggleBoostResponse - Boost durumu ve fiyat bilgisi
 */
export const togglePostBoost = async (
  data: ToggleBoostRequest
): Promise<ToggleBoostResponse> => {
  try {
    console.log('[togglePostBoost] 📤 Request:', {
      postId: data.postId,
      enabled: data.enabled,
    });

    const response = await apiService.getClient().patch<ToggleBoostResponse>(
      `/posts/${data.postId}/boost`,
      { enabled: data.enabled }
    );

    console.log('[togglePostBoost] ✅ Success:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[togglePostBoost] ❌ API Error:', {
      url: `/posts/${data.postId}/boost`,
      method: 'PATCH',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: data,
      responseData: error.response?.data,
      errorMessage: error.message,
    });
    throw error;
  }
};

