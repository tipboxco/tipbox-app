import { apiService } from '../../../services/ApiService';

/**
 * Payment Method types
 */
export interface PaymentMethod {
  id: string;
  nameOnCard: string;
  cardNumber: string;
  expirationDate: string;
  cardName?: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
  isDefault?: boolean;
}

export interface BillingHistoryEntry {
  id: string;
  planName: string;
  date: string;
  amount: string;
  cardLastFour: string;
}

export interface LinkedPaymentMethod {
  cardType: string;
  cardNumber: string;
}

/**
 * Get Payment Methods endpoint function
 * Kayıtlı ödeme yöntemlerini getirir
 * 
 * @returns PaymentMethod[] - Kayıtlı kartlar listesi
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const response = await apiService.getClient().get<PaymentMethod[]>(
      '/users/settings/payment-methods'
    );
    return response.data;
  } catch (error: any) {
    console.error('[getPaymentMethods] API Error:', {
      url: '/users/settings/payment-methods',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Billing History endpoint function
 * Fatura geçmişini getirir
 * 
 * @param startDate - Başlangıç tarihi (optional)
 * @param endDate - Bitiş tarihi (optional)
 * @param sort - Sıralama (optional)
 * @returns BillingHistoryEntry[] - Fatura geçmişi listesi
 */
export const getBillingHistory = async (
  startDate?: string,
  endDate?: string,
  sort?: string
): Promise<BillingHistoryEntry[]> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (sort) params.append('sort', sort);

    const queryString = params.toString();
    const url = `/users/settings/billing-history${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.getClient().get<BillingHistoryEntry[]>(url);
    return response.data;
  } catch (error: any) {
    console.error('[getBillingHistory] API Error:', {
      url: '/users/settings/billing-history',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Get Linked Payment Method endpoint function
 * Bağlı ödeme yöntemini getirir
 * 
 * @returns LinkedPaymentMethod - Bağlı ödeme yöntemi
 */
export const getLinkedPaymentMethod = async (): Promise<LinkedPaymentMethod | null> => {
  try {
    const response = await apiService.getClient().get<LinkedPaymentMethod>(
      '/users/settings/linked-payment-method'
    );
    return response.data;
  } catch (error: any) {
    // 404 durumunda null döndür (bağlı ödeme yöntemi yoksa)
    if (error.response?.status === 404) {
      return null;
    }
    console.error('[getLinkedPaymentMethod] API Error:', {
      url: '/users/settings/linked-payment-method',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};
