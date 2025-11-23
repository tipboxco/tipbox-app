import { apiService } from '../../../services/ApiService';
import type { TrustUser } from '../types';

/**
 * Get Trust List endpoint function
 * Kullanıcının trust listesini getirir
 * 
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @returns TrustUser[] - Trust listesi
 */
export const getTrustList = async (
  userId: string,
  searchQuery?: string
): Promise<TrustUser[]> => {
  const params = searchQuery ? { q: searchQuery } : {};
  const response = await apiService.getClient().get<TrustUser[]>(
    `/users/${userId}/trusts`,
    { params }
  );
  return response.data;
};

