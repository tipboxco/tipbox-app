import { apiService } from '../../../services/ApiService';

/**
 * Expert Balance Response
 */
export interface ExpertBalance {
  balance: number;
  cached: boolean;
}

/**
 * Expert Request Types
 */
export interface ExpertRequest {
  id: string;
  userId: string;
  description: string;
  tipsAmount: number | null;
  status: 'PENDING' | 'ANSWERED' | 'CLOSED';
  category: string | null;
  media: Array<{
    url: string;
    type: 'IMAGE' | 'VIDEO';
  }>;
  createdAt: string;
}

/**
 * Expert Request Response (with pagination)
 */
export interface ExpertRequestsResponse {
  items: ExpertRequest[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Create Expert Request Request
 */
export interface CreateExpertRequestRequest {
  description: string;
  category?: string;
  tipsAmount?: string;
  media?: File[];
}

/**
 * Answer Expert Request Request
 */
export interface AnswerExpertRequestRequest {
  answer: string;
  media?: string[];
}

/**
 * Get Expert Balance endpoint function
 * Expert TIPS balance'ını getirir
 *
 * @returns ExpertBalance - Balance bilgisi
 */
export const getExpertBalance = async (): Promise<ExpertBalance> => {
  try {
    const response = await apiService.getClient().get<ExpertBalance>('/expert/balance');
    return response.data;
  } catch (error: any) {
    console.error('[getExpertBalance] API Error:', {
      url: '/expert/balance',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Create Expert Request endpoint function
 * Expert request oluşturur
 *
 * @param data - Create expert request data
 * @returns Created expert request
 */
export const createExpertRequest = async (
  data: CreateExpertRequestRequest
): Promise<ExpertRequest> => {
  try {
    const formData = new FormData();
    formData.append('description', data.description);
    
    if (data.category) {
      formData.append('category', data.category);
    }
    
    if (data.tipsAmount) {
      formData.append('tipsAmount', data.tipsAmount);
    }
    
    if (data.media && data.media.length > 0) {
      data.media.forEach((file, index) => {
        formData.append('media', file as any);
      });
    }

    const response = await apiService.getClient().post<ExpertRequest>(
      '/expert/request',
      formData,
      {
        headers: {
          'Content-Type': undefined, // Axios'un otomatik olarak multipart/form-data boundary eklemesi için
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('[createExpertRequest] API Error:', {
      url: '/expert/request',
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
 * Get Expert Requests endpoint function
 * Expert request'leri listeler (pagination ile)
 *
 * @param status - Filtreleme için durum (PENDING, ANSWERED, CLOSED)
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns ExpertRequestsResponse - Expert requests ve pagination bilgisi
 */
export const getExpertRequests = async (
  status?: 'PENDING' | 'ANSWERED' | 'CLOSED',
  cursor?: string,
  limit: number = 20
): Promise<ExpertRequestsResponse> => {
  try {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    if (cursor) {
      params.append('cursor', cursor);
    }
    params.append('limit', Math.min(limit, 50).toString());

    const response = await apiService.getClient().get<ExpertRequestsResponse>(
      `/expert/requests?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getExpertRequests] API Error:', {
      url: `/expert/requests?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Expert Request Detail endpoint function
 * Expert request detayını getirir
 *
 * @param requestId - Expert request ID'si
 * @returns ExpertRequest - Request detay bilgileri
 */
export const getExpertRequestDetail = async (requestId: string): Promise<ExpertRequest> => {
  try {
    const response = await apiService.getClient().get<ExpertRequest>(
      `/expert/requests/${requestId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getExpertRequestDetail] API Error:', {
      url: `/expert/requests/${requestId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Answer Expert Request endpoint function
 * Expert request'e cevap verir
 *
 * @param requestId - Expert request ID'si
 * @param data - Answer data
 * @returns Success response
 */
export interface AnswerExpertRequestResponse {
  success: boolean;
  message: string;
}

export const answerExpertRequest = async (
  requestId: string,
  data: AnswerExpertRequestRequest
): Promise<AnswerExpertRequestResponse> => {
  try {
    const response = await apiService.getClient().post<AnswerExpertRequestResponse>(
      `/expert/requests/${requestId}/answer`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[answerExpertRequest] API Error:', {
      url: `/expert/requests/${requestId}/answer`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: data,
    });
    throw error;
  }
};

