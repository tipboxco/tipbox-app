import { apiService } from '../../../services/ApiService';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { UpdateApiItem } from '@/src/types/UpdateCard';
import { CardType } from '@/src/types/common';

/**
 * Feed API Response Item - Her feed item'ı type ve data içerir
 */
export interface FeedApiItem {
  type: string;
  data: 
    | (ProfilePost & { type: 'post' })
    | (ReviewApiItem & { type: 'experience' })
    | (BenchmarkApiItem & { type: 'benchmark' })
    | (TipsApiItem & { type: 'tipsAndTricks' })
    | (QuestionApiItem & { type: 'question' })
    | (UpdateApiItem & { type: 'update' });
}

/**
 * Feed API Response - Pagination ile birlikte
 */
export interface FeedApiResponse {
  items: FeedApiItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Get Feed endpoint function
 * Kullanıcının feed akışını getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (son item'ın id'si, opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns FeedApiResponse - Feed items ve pagination bilgisi
 */
export const getFeed = async (
  cursor?: string,
  limit: number = 20
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<FeedApiResponse>(
      `/feed?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('[getFeed] API Error:', {
      url: `/feed?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      },
    });
    throw error;
  }
};

