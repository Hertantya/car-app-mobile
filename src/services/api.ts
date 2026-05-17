import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Car, LoginPayload, RegisterPayload, Report, UserPreference } from '../types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8000/api';

const TOKEN_KEY = 'auth_token';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach saved token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};


export const apiLogin = async (payload: LoginPayload) => {
  const response = await api.post('/login', payload);
  return response.data;
};

export const apiRegister = async (payload: RegisterPayload) => {
  const response = await api.post('/register', payload);
  return response.data;
};

export const apiLogout = async (): Promise<void> => {
  await api.post('/logout');
};

export const apiGetMe = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const apiFetchCars = async (): Promise<Car[]> => {
  const response = await api.get('/cars');
  return response.data.data;
};


export const apiSavePreference = async (
  carId: number,
  action: 'like' | 'skip'
): Promise<void> => {
  await api.post('/preferences', { car_id: carId, action });
};

export const apiSyncPreferences = async (
  preferences: Pick<UserPreference, 'car_id' | 'action'>[]
): Promise<void> => {
  await api.post('/preferences/sync', { preferences });
};


export const apiFetchReport = async (): Promise<Report> => {
  const response = await api.get('/reports');
  return response.data;
};

export default api;
