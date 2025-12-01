import { apiService } from '../../../services/ApiService';
import type { EventApiItem, EventsApiResponse } from '@/src/types/EventCard';

/**
 * Get Active Events endpoint function
 * Aktif eventlerin listesini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns EventsApiResponse - Events items ve pagination bilgisi
 */
export const getActiveEvents = async (
  cursor?: string,
  limit: number = 20
): Promise<EventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<EventsApiResponse>(
      `/events/active?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Active Events API Error:', {
      url: `/events/active?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Upcoming Events endpoint function
 * Yaklaşan eventlerin listesini getirir (pagination ile)
 *
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns EventsApiResponse - Events items ve pagination bilgisi
 */
export const getUpcomingEvents = async (
  cursor?: string,
  limit: number = 20
): Promise<EventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<EventsApiResponse>(
      `/events/upcoming?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Upcoming Events API Error:', {
      url: `/events/upcoming?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

