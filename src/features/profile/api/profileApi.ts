import { apiService } from '../../../services/ApiService';
import type { UserProfile, InventoryItem, ProfilePost } from '../types';

/**
 * Get User Profile endpoint function
 * Kullanıcı profil bilgilerini getirir
 * 
 * @param userId - Kullanıcı ID'si
 * @returns UserProfile - Kullanıcı profil bilgileri
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile> => {
  const response = await apiService.getClient().get<UserProfile>(
    `/users/${userId}/profile`
  );
  return response.data;
};

/**
 * Get Inventory endpoint function
 * Kullanıcının envanter ürünlerini getirir
 * Token'dan user_id otomatik olarak alınır
 * 
 * @returns InventoryItem[] - Envanter ürün listesi
 */
export const getInventory = async (): Promise<InventoryItem[]> => {
  const response = await apiService.getClient().get<InventoryItem[]>(
    '/inventory'
  );
  return response.data;
};

/**
 * Get User Posts endpoint function
 * Kullanıcının profil feed postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfilePost[] - Kullanıcının gönderi listesi
 */
export const getUserPosts = async (
  userId: string
): Promise<ProfilePost[]> => {
  const response = await apiService.getClient().get<ProfilePost[]>(
    `/users/${userId}/posts`
  );
  return response.data;
};

