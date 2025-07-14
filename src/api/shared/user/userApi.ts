import apiClient from '../../axios';
import { ENDPOINTS } from '../../config';
import type {
  GetCurrentUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  GetUsersParams,
  GetUsersResponse,
  User,
} from './types';

// Mevcut kullanıcı bilgilerini getir
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<GetCurrentUserResponse>(
    ENDPOINTS.AUTH.ME
  );
  return response.data.data;
};

// Kullanıcı bilgilerini güncelle
export const updateUser = async (
  id: string,
  data: UpdateUserRequest
): Promise<User> => {
  const response = await apiClient.put<UpdateUserResponse>(
    ENDPOINTS.USERS.BY_ID(id),
    data
  );
  return response.data.data;
};

// Tüm kullanıcıları getir (paginated)
export const getUsers = async (
  params?: GetUsersParams
): Promise<GetUsersResponse['data']> => {
  const response = await apiClient.get<GetUsersResponse>(ENDPOINTS.USERS.BASE, {
    params,
  });
  return response.data.data;
};

// ID ile kullanıcı getir
export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get<GetCurrentUserResponse>(
    ENDPOINTS.USERS.BY_ID(id)
  );
  return response.data.data;
};

// Kullanıcı sil
export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(ENDPOINTS.USERS.BY_ID(id));
};
