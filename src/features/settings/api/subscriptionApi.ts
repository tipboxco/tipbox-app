import { apiService } from '../../../services/ApiService';

/**
 * Subscription types
 */
export interface Subscription {
  id: string;
  planName: string;
  renewalDate: string;
  status: 'active' | 'cancelled' | 'expired';
  benefits?: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  benefits: string[];
  duration: 'monthly' | 'yearly';
}

/**
 * Get Current Subscription endpoint function
 * Mevcut abonelik bilgisini getirir
 * 
 * @returns Subscription - Mevcut abonelik bilgisi
 */
export const getCurrentSubscription = async (): Promise<Subscription | null> => {
  try {
    const response = await apiService.getClient().get<Subscription>(
      '/users/settings/subscription'
    );
    return response.data;
  } catch (error: any) {
    // 404 durumunda null döndür (abonelik yoksa)
    if (error.response?.status === 404) {
      return null;
    }
    console.error('[getCurrentSubscription] API Error:', {
      url: '/users/settings/subscription',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Subscription Plans endpoint function
 * Mevcut abonelik planlarını getirir
 * 
 * @returns SubscriptionPlan[] - Abonelik planları listesi
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await apiService.getClient().get<SubscriptionPlan[]>(
      '/subscription/plans'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getSubscriptionPlans] API Error:', {
      url: '/subscription/plans',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};
