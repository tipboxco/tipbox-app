import { apiService } from '../../../services/ApiService';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { 
  RegisterResponse, 
  LoginResponse,
  ApiLoginResponse,
  ApiRegisterResponse 
} from '../types';

/**
 * Register endpoint function
 * Kullanıcı kayıt işlemi için API çağrısı
 * 
 * @param credentials - Kayıt bilgileri (email, password, name)
 * @returns RegisterResponse - Kayıt sonucu
 */
export const register = async (
  credentials: RegisterCredentials
): Promise<RegisterResponse> => {
  const response = await apiService.getClient().post<ApiRegisterResponse>(
    '/auth/register',
    credentials
  );

  // API response'unu beklenen formata transform et
  const transformedResponse: RegisterResponse = {
    user: {
      id: response.data.id,
      name: response.data.fullName,
      email: response.data.email,
      isGuest: false,
    },
    message: response.data.message || 'Kayıt işlemi başarıyla tamamlandı',
  };

  return transformedResponse;
};

/**
 * Login endpoint function
 * Kullanıcı giriş işlemi için API çağrısı
 * 
 * @param credentials - Giriş bilgileri (email, password)
 * @returns ApiLoginResponse - Backend'den gelen ham response (store'da kullanılacak)
 */
export const login = async (
  credentials: LoginCredentials
): Promise<ApiLoginResponse> => {
  try {
    const client = apiService.getClient();
    const baseURL = client.defaults.baseURL;
    const fullURL = `${baseURL}/auth/login`;
    
    console.log('[login] Request details:', {
      baseURL,
      endpoint: '/auth/login',
      fullURL,
      method: 'POST',
      credentials: {
        email: credentials.email,
        password: '***', // Güvenlik için password'ü gizle
      },
    });
    
    const response = await client.post<ApiLoginResponse>(
      '/auth/login',
      credentials
    );

    console.log('[login] ✅ Success:', {
      status: response.status,
      userId: response.data.id,
      email: response.data.email,
    });

    // Backend'den gelen ham response'u direkt döndür (store'da transform edilecek)
    return response.data;
  } catch (error: any) {
    console.error('[login] ❌ API Error:', {
      url: '/auth/login',
      baseURL: apiService.getClient().defaults.baseURL,
      fullURL: `${apiService.getClient().defaults.baseURL}/auth/login`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    });
    throw error;
  }
};

/**
 * Verify Email endpoint function
 * Email doğrulama kodu ile email'i doğrular
 * 
 * @param email - Kullanıcı email'i
 * @param code - Doğrulama kodu
 * @returns ApiLoginResponse - Token ve kullanıcı bilgileri
 */
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  token: string;
  refreshToken?: string; // Backend'den geliyorsa eklenir
  message: string;
}

export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<VerifyEmailResponse> => {
  try {
    const response = await apiService.getClient().post<VerifyEmailResponse>(
      '/auth/verify-email',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[verifyEmail] API Error:', {
      url: '/auth/verify-email',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Current User endpoint function
 * Mevcut kullanıcı bilgilerini getirir
 * 
 * @returns User - Kullanıcı bilgileri
 */
export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  status: string;
  auth0Id: string | null;
  walletAddress: string | null;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const getCurrentUser = async (): Promise<CurrentUser> => {
  try {
    const response = await apiService.getClient().get<CurrentUser>('/auth/me');
    return response.data;
  } catch (error: any) {
    console.error('[getCurrentUser] API Error:', {
      url: '/auth/me',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Forgot Password endpoint function
 * Şifre sıfırlama kodu gönderir
 * 
 * @param email - Kullanıcı email'i
 * @returns Success response
 */
export interface ForgotPasswordRequest {
  mail: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export const forgotPassword = async (
  email: string
): Promise<ForgotPasswordResponse> => {
  try {
    const response = await apiService.getClient().post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { mail: email }
    );
    return response.data;
  } catch (error: any) {
    console.error('[forgotPassword] API Error:', {
      url: '/auth/forgot-password',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Verify Reset Code endpoint function
 * Şifre sıfırlama kodunu doğrular
 * 
 * @param email - Kullanıcı email'i
 * @param code - Doğrulama kodu
 * @returns Success response
 */
export interface VerifyResetCodeRequest {
  mail: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  success: boolean;
  message: string;
}

export const verifyResetCode = async (
  data: VerifyResetCodeRequest
): Promise<VerifyResetCodeResponse> => {
  try {
    const response = await apiService.getClient().post<VerifyResetCodeResponse>(
      '/auth/verify-reset-code',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[verifyResetCode] API Error:', {
      url: '/auth/verify-reset-code',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Reset Password endpoint function
 * Şifreyi sıfırlar
 * 
 * @param email - Kullanıcı email'i
 * @param password - Yeni şifre
 * @returns Success response
 */
export interface ResetPasswordRequest {
  email: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  try {
    const response = await apiService.getClient().post<ResetPasswordResponse>(
      '/auth/reset-password',
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[resetPassword] API Error:', {
      url: '/auth/reset-password',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Logout endpoint function
 * Kullanıcı çıkışı yapar
 * 
 * @returns Success response
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

export const logout = async (): Promise<LogoutResponse> => {
  try {
    const response = await apiService.getClient().post<LogoutResponse>('/auth/logout');
    return response.data;
  } catch (error: any) {
    console.error('[logout] API Error:', {
      url: '/auth/logout',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Setup Profile endpoint function
 * Kullanıcı profil bilgilerini kaydeder (kayıt sonrası setup)
 * 
 * @param data - Profil bilgileri (fullName, username, profileImage)
 * @returns Success response
 */
export interface SetupProfileRequest {
  fullName: string;
  username: string;
  profileImage?: string; // URI
  banner?: string; // URI
  selectCategories: Array<{
    categoryId: string;
    subCategoryIds: string[];
  }>;
}

export interface SetupProfileResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
}

/**
 * Get MIME type from file extension or URI
 * Backend'in beklediği formatlar: jpg, jpeg, png, gif, webp
 */
const getImageMimeType = (uri: string): string => {
  const filename = uri.split('/').pop() || '';
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // MIME type mapping
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  
  return mimeTypes[extension] || 'image/jpeg'; // Default to jpeg
};

/**
 * Get file extension from URI
 */
const getFileExtension = (uri: string): string => {
  const filename = uri.split('/').pop() || '';
  const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Backend'in beklediği formatlar: jpg, jpeg, png, gif, webp
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return allowedExtensions.includes(extension) ? extension : 'jpg';
};

export const setupProfile = async (
  data: SetupProfileRequest
): Promise<SetupProfileResponse> => {
  try {
    // FormData oluştur (React Native için)
    const formData = new FormData();
    
    // Field isimleri backend'e göre: FullName, UserName
    formData.append('FullName', data.fullName);
    formData.append('UserName', data.username);
    
    // selectCategories JSON formatında gönder
    // Backend sadece selectedCategories array'ini bekliyor
    formData.append('selectCategories', JSON.stringify({
      selectedCategories: data.selectCategories
    }));

    // Seçilen varsayılan avatar (API listesinden): AvatarId gönder
    if (data.profileImage?.startsWith('avatar://')) {
      const avatarId = data.profileImage.replace('avatar://', '');
      formData.append('AvatarId', avatarId);
    }
    
    // Upload edilen foto: Avatar dosyası gönder (field name: Avatar)
    // Backend: max 5MB, JPG/PNG/GIF/WebP formatları
    if (data.profileImage && !data.profileImage.startsWith('avatar://')) {
      const imageUri = data.profileImage;
      const extension = getFileExtension(imageUri);
      const mimeType = getImageMimeType(imageUri);
      const filename = `avatar.${extension}`;
      
      formData.append('Avatar', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);
    }
    
    // Banner varsa ekle (field name: Banner)
    // Backend: max 5MB, JPG/PNG/GIF/WebP formatları
    if (data.banner) {
      const imageUri = data.banner;
      const extension = getFileExtension(imageUri);
      const mimeType = getImageMimeType(imageUri);
      const filename = `banner.${extension}`;
      
      formData.append('Banner', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);
    }
    
    console.log('[setupProfile] Request data:', {
      fullName: data.fullName,
      username: data.username,
      hasAvatar: !!data.profileImage,
      hasBanner: !!data.banner,
      categoriesCount: data.selectCategories.length,
    });
    
    const response = await apiService.getClient().post<SetupProfileResponse>(
      '/users/setup-profile',
      formData,
      {
        headers: {
          'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
        },
      }
    );
    
    console.log('[setupProfile] ✅ Success:', {
      success: response.data.success,
      message: response.data.message,
      user: response.data.user,
    });
    
    return response.data;
  } catch (error: any) {
    console.error('[setupProfile] ❌ API Error:', {
      url: '/users/setup-profile',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Check Username Availability endpoint function
 * Username'in müsait olup olmadığını kontrol eder
 * 
 * @param username - Kontrol edilecek username
 * @returns Username availability response
 */
export interface UsernameCheckResponse {
  isValid: boolean;
  isAvailable: boolean;
  message: string | null;
}

export const checkUsernameAvailability = async (
  username: string
): Promise<UsernameCheckResponse> => {
  try {
    const response = await apiService.getClient().get<UsernameCheckResponse>(
      `/users/username/check?username=${encodeURIComponent(username)}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[checkUsernameAvailability] API Error:', {
      url: '/users/username/check',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Username Suggestions endpoint function
 * Username için öneriler getirir
 * 
 * @param username - Temel username
 * @param limit - Öneri sayısı (1-10 arası, varsayılan: 5)
 * @returns Username suggestions response
 */
export interface UsernameSuggestionsResponse {
  suggestions: string[];
}

export const getUsernameSuggestions = async (
  username: string,
  limit: number = 5
): Promise<UsernameSuggestionsResponse> => {
  try {
    const response = await apiService.getClient().get<UsernameSuggestionsResponse>(
      `/users/username/suggestions?username=${encodeURIComponent(username)}&limit=${limit}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getUsernameSuggestions] API Error:', {
      url: '/users/username/suggestions',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Update User Interests endpoint function
 * Kullanıcının ilgi alanlarını (kategoriler) günceller
 * 
 * @param subCategoryIds - Seçilen sub category ID'leri
 * @returns Success response
 */
export interface UpdateUserInterestsRequest {
  subCategoryIds: string[];
}

export interface UpdateUserInterestsResponse {
  success: boolean;
  message: string;
  interests?: string[];
}

export const updateUserInterests = async (
  subCategoryIds: string[]
): Promise<UpdateUserInterestsResponse> => {
  try {
    const response = await apiService.getClient().post<UpdateUserInterestsResponse>(
      '/users/interests',
      { subCategoryIds }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('[updateUserInterests] API Error:', {
      url: '/users/interests',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Google Login endpoint function
 * Firebase Authentication ile Google OAuth ile giriş yapmak için API çağrısı
 * 
 * @param idToken - Firebase'den alınan ID token (Firebase Authentication ile doğrulanmış)
 * @returns ApiLoginResponse - Backend'den gelen ham response (store'da kullanılacak)
 */
export interface GoogleLoginRequest {
  idToken: string;
}

export const googleLogin = async (
  idToken: string
): Promise<ApiLoginResponse> => {
  try {
    const response = await apiService.getClient().post<ApiLoginResponse>(
      '/auth/google',
      { idToken }
    );

    // Backend'den gelen ham response'u direkt döndür (store'da transform edilecek)
    return response.data;
  } catch (error: any) {
    console.error('[googleLogin] API Error:', {
      url: '/auth/google',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * User Category types
 * Kullanıcı kategori seçimi için type tanımları
 */
export interface UserSubCategory {
  subCategoryId: string;
  name: string;
}

export interface UserCategory {
  categoryId: string;
  name: string;
  subCategories: UserSubCategory[];
}

/**
 * Avatar listesi tipi (GET /users/avatars response)
 */
export interface UserAvatar {
  id: string;
  name: string;
  url: string;
}

export interface GetUserAvatarsResponse {
  success: boolean;
  avatars: UserAvatar[];
}

/**
 * Get User Avatars endpoint function
 * Kullanıcı avatar seçimi için varsayılan avatar listesini getirir
 *
 * @returns GetUserAvatarsResponse - Avatar listesi
 */
export const getUserAvatars = async (): Promise<GetUserAvatarsResponse> => {
  try {
    const response = await apiService.getClient().get<GetUserAvatarsResponse>(
      '/users/avatars'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getUserAvatars] API Error:', {
      url: '/users/avatars',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get User Categories endpoint function
 * Kullanıcı kategori seçimi için tüm kategorileri ve alt kategorileri getirir
 * Her kategori için en fazla 10 alt kategori döner (alfabetik sıraya göre)
 * 
 * @returns UserCategory[] - Kategori listesi (her kategori içinde subCategories var)
 */
export const getUserCategories = async (): Promise<UserCategory[]> => {
  try {
    const response = await apiService.getClient().get<UserCategory[]>(
      '/users/categories'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getUserCategories] API Error:', {
      url: '/users/categories',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};
