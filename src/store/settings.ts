import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Language = 'az' | 'en' | 'ru';
export type ThemePreference = 'system' | 'light' | 'dark';
export type Currency = 'PLN' | 'AZN' | 'USD';

type SettingsState = {
  name: string;
  language: Language;
  theme: ThemePreference;
  baseCurrency: Currency;
  waterGoalMl: number;
  sleepGoalMin: number;
  monthlyIncomeGoal: number;
  onboardingDone: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
};

/** İstifadəçi ayarları. Telefonda SQLite key-value anbarında saxlanılır. */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      name: 'Vahid',
      language: 'az',
      theme: 'system',
      baseCurrency: 'PLN',
      waterGoalMl: 2000,
      sleepGoalMin: 8 * 60,
      monthlyIncomeGoal: 5000,
      onboardingDone: false,
      set: (patch) => set(patch),
    }),
    {
      name: 'foxday-settings',
      storage: createJSONStorage(() => Storage),
    },
  ),
);
