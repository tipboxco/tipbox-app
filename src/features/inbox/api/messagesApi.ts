import { apiService } from '../../../services/ApiService';
import type { InboxMessage } from '../types';

/**
 * Get Messages endpoint
 * Kullanıcının mesaj listesini getirir
 *
 * Kullanıcı ID'si backend tarafında Authorization header'indaki token'dan bulunur.
 */
export const getMessages = async (): Promise<InboxMessage[]> => {
  const response = await apiService.getClient().get<InboxMessage[]>('/messages');
  return response.data;
};


