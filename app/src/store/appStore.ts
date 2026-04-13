import { create } from 'zustand';

interface AppState {
  locale: 'ar' | 'en';
  theme: 'light' | 'dark';
  setLocale: (locale: 'ar' | 'en') => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  locale: 'ar',
  theme: 'light',
  setLocale: (locale) => set({ locale }),
  setTheme: (theme) => set({ theme }),
}));
