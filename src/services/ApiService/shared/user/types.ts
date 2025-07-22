// User DTO
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// User Response Types
export interface GetCurrentUserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  data: User;
  message?: string;
}

// Pagination
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
} 