import { apiService } from '../../../services/ApiService';
import type { EventApiItem, EventsApiResponse, UpcomingEventsApiResponse } from '@/src/types/EventCard';
import type { EventDetailApiResponse, LimitedEventApiResponse } from '../types';
import type { FeedApiResponse } from '@/src/features/feed/api/feedApi';

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
 * @returns UpcomingEventsApiResponse - Events items ve pagination bilgisi (interaction ve participants yok)
 */
export const getUpcomingEvents = async (
  cursor?: string,
  limit: number = 20
): Promise<UpcomingEventsApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('limit', limit.toString());

  try {
    const response = await apiService.getClient().get<UpcomingEventsApiResponse>(
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

/**
 * Get Event Detail endpoint function
 * Belirli bir event'in detaylı bilgilerini getirir (banner, rewards, isJoined, vb.)
 *
 * @param eventId - Event ID
 * @returns EventDetailApiResponse - Event detay bilgileri
 */
export const getEventDetail = async (
  eventId: string
): Promise<EventDetailApiResponse> => {
  try {
    const response = await apiService.getClient().get<EventDetailApiResponse>(
      `/events/${eventId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Event Detail API Error:', {
      url: `/events/${eventId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Event Posts endpoint function
 * Belirli bir event'in postlarını getirir (pagination ile)
 *
 * @param eventId - Event ID
 * @param cursor - Pagination cursor (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns FeedApiResponse - Event posts ve pagination bilgisi
 */
export const getEventPosts = async (
  eventId: string,
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
      `/events/${eventId}/posts?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Event Posts API Error:', {
      url: `/events/${eventId}/posts?${params.toString()}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Limited Event endpoint function
 * /events/limited endpoint'inden limited event bilgilerini getirir
 *
 * @returns LimitedEventApiResponse - Limited event bilgileri (leaderboard, userScore, vb.)
 */
export const getLimitedEvent = async (): Promise<LimitedEventApiResponse> => {
  try {
    const response = await apiService.getClient().get<LimitedEventApiResponse>(
      '/events/limited'
    );
    return response.data;
  } catch (error: any) {
    console.error('Limited Event API Error:', {
      url: '/events/limited',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

