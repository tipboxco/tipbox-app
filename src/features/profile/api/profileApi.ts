import { apiService } from '../../../services/ApiService';
import type {
  UserProfile,
  InventoryItem,
  ProfilePost,
  ProfileReview,
  ProfileBenchmark,
  ProfileTipsAndTricks,
  ProfileReplies,
} from '../types';

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

/**
 * Get User Reviews endpoint function
 * Kullanıcının review postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileReview[] - Kullanıcının review listesi
 */
export const getUserReviews = async (
  userId: string
): Promise<ProfileReview[]> => {
  const response = await apiService.getClient().get<ProfileReview[]>(
    `/users/${userId}/reviews`
  );
  return response.data;
};

/**
 * Get User Benchmarks endpoint function
 * Kullanıcının benchmark postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileBenchmark[] - Kullanıcının benchmark listesi
 */
export const getUserBenchmarks = async (
  userId: string
): Promise<ProfileBenchmark[]> => {
  const response = await apiService.getClient().get<ProfileBenchmark[]>(
    `/users/${userId}/benchmarks`
  );
  return response.data;
};

/**
 * Get User Tips & Tricks endpoint function
 * Kullanıcının tips & tricks postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileTipsAndTricks[] - Kullanıcının tips & tricks listesi
 */
export const getUserTipsAndTricks = async (
  userId: string
): Promise<ProfileTipsAndTricks[]> => {
  const response = await apiService.getClient().get<ProfileTipsAndTricks[]>(
    `/users/${userId}/tips`
  );
  return response.data;
};

/**
 * Get User Replies endpoint function
 * Kullanıcının replies/question postlarını getirir
 *
 * @param userId - Kullanıcı ID'si
 * @returns ProfileReplies[] - Kullanıcının replies/question listesi
 */
export const getUserReplies = async (
  userId: string
): Promise<ProfileReplies[]> => {
  const response = await apiService.getClient().get<ProfileReplies[]>(
    `/users/${userId}/replies`
  );
  return response.data;
};

