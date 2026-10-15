import {
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { migrate } from '@/db';
import i18n from '@/i18n';
import { configureNotifications, syncReminders } from '@/services/notifications';
import { refreshTracker, registerBackgroundTracker } from '@/services/tracker';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Bazanı ən son versiyaya gətir (ilk açılışda cədvəlləri yaradır).
migrate();
configureNotifications();

/** Ayarlar telefondan oxunub qurtarıbmı (onboarding qərarı üçün). */
function useSettingsHydrated() {
  return useSyncExternalStore(
    (onChange) => useSettings.persist.onFinishHydration(onChange),
    () => useSettings.persist.hasHydrated(),
  );
}

const modal = {
  presentation: 'transparentModal' as const,
  animation: 'fade' as const,
  contentStyle: { backgroundColor: 'transparent' },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const hydrated = useSettingsHydrated();
  const language = useSettings((s) => s.language);
  const notifKey = useSettings((s) => `${s.notifWater}${s.notifHabits}${s.notifEvening}`);
  const { colors, isDark } = useTheme();
  const ready = (loaded || !!error) && hydrated;

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Dil və ya bildiriş ayarları dəyişəndə xatırlatmaları yenidən qur
  useEffect(() => {
    if (hydrated) syncReminders();
  }, [hydrated, language, notifKey]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Addımlar və ekran vaxtı limitləri: açılışda, ön plana qayıdanda və arxa fonda (~15 dəq)
  useEffect(() => {
    if (!hydrated) return;
    registerBackgroundTracker();
    refreshTracker();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshTracker();
    });
    return () => sub.remove();
  }, [hydrated]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgApp } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={modal} />
        <Stack.Screen name="celebrate" options={modal} />
        <Stack.Screen name="missed" options={modal} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </>
  );
}
