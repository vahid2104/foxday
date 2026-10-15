import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useDbVersion } from '@/db';

/**
 * Telefon məlumatları (ekran vaxtı, icazələr) bazada deyil — ona görə ekran
 * app ön plana qayıdanda və hər dəqiqə yenidən oxunsun deyə sayğac qaytarır.
 */
export function useForegroundTick(intervalMs = 60_000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') bump();
    });
    const id = setInterval(bump, intervalMs);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [intervalMs]);
  return tick;
}

/**
 * Telefondan (yerli moduldan) oxunan məlumat üçün: hər render-də yenidən oxunur,
 * React Compiler bunu yaddaşda saxlamasın deyə 'use no memo'.
 */
export function useLive<T>(query: () => T): T {
  'use no memo';
  useForegroundTick();
  useDbVersion((s) => s.version);
  return query();
}
