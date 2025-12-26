export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  school_id: number;
  school?: {
    id: number;
    name: string;
    npsn: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
