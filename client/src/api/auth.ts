import apiClient from './client';
import type { User } from '../types';

export interface RegisterInput {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  register: (data: RegisterInput) =>
    apiClient.post<AuthResponse>('/auth/register', data),
  login: (data: LoginInput) => apiClient.post<AuthResponse>('/auth/login', data),
  logout: () => apiClient.post<void>('/auth/logout'),
  me: () => apiClient.get<{ user: User }>('/auth/me'),
};
