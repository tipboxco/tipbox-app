import { apiService } from '../../../services/ApiService';

/**
 * Payment & Subscription API types (rehberle uyumlu)
 */
export interface PaymentMethod {
  id: string;
  card_alias: string;
  brand: string;
  last4: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  current_plan_id: string;
  plan_name: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  next_billing_date: string;
  benefits: string[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  description: string | null;
}

export interface PaymentDashboard {
  saved_cards: PaymentMethod[];
  active_subscription: Subscription | null;
  recent_invoices: Invoice[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'MONTHLY' | 'YEARLY';
  benefits: string[];
}

/** Kart ekleme request */
export interface AddPaymentMethodRequest {
  payment_token: string;
  card_alias: string;
}

/** Kart ismi güncelleme request */
export interface UpdatePaymentMethodRequest {
  card_alias: string;
}

/** API hata response (error_code ile) */
export interface PaymentApiErrorResponse {
  message?: string;
  error_code?:
    | 'CARD_NOT_FOUND'
    | 'CARD_IN_USE_BY_SUBSCRIPTION'
    | 'INSUFFICIENT_FUNDS'
    | 'INVALID_EXPIRY'
    | 'CARD_DECLINED';
}

/**
 * GET /users/settings/payment-dashboard
 * Ödeme özeti: kartlar, aktif abonelik, son faturalar (tek istek)
 */
export const getPaymentDashboard = async (): Promise<PaymentDashboard> => {
  const response = await apiService.getClient().get<PaymentDashboard>(
    '/users/settings/payment-dashboard'
  );
  return response.data;
};

/**
 * POST /users/settings/payment-methods
 * Yeni kart ekleme (payment_token sağlayıcıdan alınır; kart numarası/CVV gönderilmez)
 */
export const addPaymentMethod = async (
  body: AddPaymentMethodRequest
): Promise<PaymentMethod> => {
  const response = await apiService.getClient().post<PaymentMethod>(
    '/users/settings/payment-methods',
    body
  );
  return response.data;
};

/**
 * PATCH /users/settings/payment-methods/:id
 * Kart ismini güncelleme
 */
export const updatePaymentMethod = async (
  id: string,
  body: UpdatePaymentMethodRequest
): Promise<PaymentMethod> => {
  const response = await apiService.getClient().patch<PaymentMethod>(
    `/users/settings/payment-methods/${id}`,
    body
  );
  return response.data;
};

/**
 * DELETE /users/settings/payment-methods/:id
 * Kart silme (aktif abonelikte kullanılıyorsa 409 döner)
 */
export const deletePaymentMethod = async (id: string): Promise<void> => {
  await apiService.getClient().delete(`/users/settings/payment-methods/${id}`);
};

export type InvoicesSortBy = 'date_asc' | 'date_desc';

export interface GetInvoicesParams {
  sort_by?: InvoicesSortBy;
  limit?: number;
  offset?: number;
}

/**
 * GET /users/settings/invoices
 * Fatura geçmişi (sayfalı)
 */
export const getInvoices = async (
  params: GetInvoicesParams = {}
): Promise<Invoice[]> => {
  const { sort_by = 'date_desc', limit = 20, offset = 0 } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('sort_by', sort_by);
  searchParams.set('limit', String(Math.min(100, limit)));
  searchParams.set('offset', String(offset));
  const response = await apiService.getClient().get<Invoice[]>(
    `/users/settings/invoices?${searchParams.toString()}`
  );
  return response.data;
};
