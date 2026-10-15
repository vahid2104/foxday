import { useColorScheme } from 'react-native';

import { useSettings } from '@/store/settings';

import { darkColors, lightColors, type ColorTokens } from './tokens';

export * from './tokens';

/** Aktiv temanın rənglərini qaytarır (Sistem / İşıqlı / Qaranlıq ayarına görə). */
export function useTheme(): { colors: ColorTokens; isDark: boolean } {
  const system = useColorScheme();
  const preference = useSettings((s) => s.theme);
  const isDark = preference === 'system' ? system === 'dark' : preference === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
