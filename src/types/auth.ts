// Auth ile ilgili global tipler

export interface User {
  id: string;
  email?: string;
  name: string;
  isGuest: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}
