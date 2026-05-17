export interface Car {
  id: number;
  brand: string;
  model: string;
  type: string;
  image_url: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserPreference {
  id?: number;
  car_id: number;
  action: 'like' | 'skip';
  synced: number; // 0 = pending, 1 = synced
  created_at?: string;
}

export interface Report {
  most_liked_brand: string | null;
  most_liked_model: string | null;
  most_liked_type: string | null;
  total_likes: number;
  total_skips: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
};

export type AuthStackParamList = {
  login: undefined;
};

export type TabParamList = {
  index: undefined;
  report: undefined;
};
