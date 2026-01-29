import { apiService } from '../../../services/ApiService';
import type { SubscriptionPlan } from './paymentApi';

export type { SubscriptionPlan } from './paymentApi';

/**
 * GET /subscription/plans
 * Abonelik planları kataloğu (fiyat sayfası / plan seçimi)
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiService.getClient().get<SubscriptionPlan[]>(
    '/subscription/plans'
  );
  return response.data;
};
