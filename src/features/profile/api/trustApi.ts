import { apiService } from '../../../services/ApiService';
import type { TrustUser, TrusterUser } from '../types';

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

/**
 * Get Truster List endpoint function
 * Kullanıcının truster listesini getirir
 *
 * @param userId - Kullanıcı ID'si
 * @param searchQuery - İsim veya kullanıcı adına göre arama (opsiyonel)
 * @returns TrusterUser[] - Truster listesi
 */
export const getTrusterList = async (
  userId: string,
  searchQuery?: string
): Promise<TrusterUser[]> => {
  const params = searchQuery ? { q: searchQuery } : {};
  const response = await apiService.getClient().get<TrusterUser[]>(
    `/users/${userId}/trusters`,
    { params }
  );
  return response.data;
};


