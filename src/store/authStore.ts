import { create } from 'zustand';
import { User } from '../types';
import {
  apiLogin,
  apiLogout,
  apiRegister,
  getToken,
  removeToken,
  saveToken,
} from '../services/api';
import { clearLocalData, initDatabase } from '../database/database';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,

  initialize: async () => {
    try {
      await initDatabase(); 
      const token = await getToken();
      if (token) {
        set({ token, isAuthenticated: true });
      }
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      set({ isInitializing: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await apiLogin({ email, password });
      console.log(data)
      await saveToken(data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await apiRegister({
        name,
        email,
        password,
        password_confirmation: password,
      });
      await saveToken(data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout().catch(() => {});
      await removeToken();
      await clearLocalData();
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
