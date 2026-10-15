import { PermissionsAndroid, Platform } from 'react-native';

import Tracker, { type UsageResult } from '../../modules/foxday-tracker';

import { migrate } from '@/db';
import { claimLimitAlert, getAppLimits, recordStepReading } from '@/db/tracker';
import i18n from '@/i18n';
import { today } from '@/lib/dates';
import { limitLevel, startOfDayMs } from '@/lib/tracker';
import { useSettings } from '@/store/settings';

import { notifyNow } from './notifications';

/**
 * Ekran vaxtı və addımlar — yerli Kotlin modulu üzərindən.
 * Expo Go-da modul yoxdur: `trackerAvailable()` false qaytarır və ekranlar "APK-da işləyəcək" göstərir.
 */
export const trackerAvailable = () => Tracker != null;

export function hasUsageAccess(): boolean {
  try {
    return Tracker?.hasUsageAccess() ?? false;
  } catch {
    return false;
  }
}

export function openUsageAccessSettings() {
  Tracker?.openUsageAccessSettings();
}

/** Bu günün ekran vaxtı (gecə 00:00-dan indiyə qədər). */
export function getTodayUsage(): UsageResult | null {
  if (!Tracker || !hasUsageAccess()) return null;
  try {
    return Tracker.getUsage(startOfDayMs(), Date.now());
  } catch (e) {
    console.warn('getUsage', e);
    return null;
  }
}

/** Gün üzrə ekran vaxtı (ms) — həftəlik qrafik üçün. */
export function getUsageForDay(date: Date): UsageResult | null {
  if (!Tracker || !hasUsageAccess()) return null;
  try {
    const start = startOfDayMs(date);
    return Tracker.getUsage(start, start + 24 * 3600_000);
  } catch {
    return null;
  }
}

export const totalMs = (u: UsageResult | null) => (u ? u.apps.reduce((s, a) => s + a.ms, 0) : 0);

// ---------- Addımlar ----------

export function hasStepSensor(): boolean {
  try {
    return Tracker?.hasStepSensor() ?? false;
  } catch {
    return false;
  }
}

export async function hasActivityPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 29) return true;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
}

/** Android 10+ "Fiziki fəaliyyət" icazəsi (addım sensoru üçün). */
export async function requestActivityPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 29) return true;
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

/** Sensoru oxuyub bu günün addımlarını yeniləyir. */
export async function syncSteps(): Promise<void> {
  if (!Tracker || !hasStepSensor() || !(await hasActivityPermission())) return;
  try {
    const counter = await Tracker.getStepCounter();
    if (counter >= 0) recordStepReading(Math.round(counter), today());
  } catch (e) {
    console.warn('syncSteps', e);
  }
}

// ---------- Limitlər ----------

/** Limitə yaxınlaşan (80%) və keçən (100%) app-lər üçün gündə bir dəfə bildiriş. */
export async function checkLimits(): Promise<void> {
  const limits = getAppLimits();
  if (limits.length === 0) return;
  const usage = getTodayUsage();
  if (!usage) return;
  const byPkg = new Map(usage.apps.map((a) => [a.packageName, a.ms]));
  const date = today();
  for (const l of limits) {
    const usedMin = Math.floor((byPkg.get(l.packageName) ?? 0) / 60_000);
    const level = limitLevel(usedMin, l.limitMin);
    if (level === 0 || !claimLimitAlert(l.packageName, date, level)) continue;
    const key = level === 100 ? 'over' : 'near';
    await notifyNow(
      i18n.t(`notifications.limit_${key}Title`, { app: l.label }),
      i18n.t(`notifications.limit_${key}Body`, { used: usedMin, limit: l.limitMin }),
    );
  }
}

/** App açılanda / ön plana qayıdanda çağırılır. */
export async function refreshTracker(): Promise<void> {
  if (!Tracker) return;
  await syncSteps();
  await checkLimits();
}

// ---------- Arxa fon tapşırığı (~15 dəqiqədən bir) ----------

const TASK = 'foxday-tracker';

/* eslint-disable @typescript-eslint/no-require-imports */
type TaskManagerT = typeof import('expo-task-manager');
type BackgroundTaskT = typeof import('expo-background-task');
let TaskManager: TaskManagerT | null = null;
let BackgroundTask: BackgroundTaskT | null = null;
if (Tracker) {
  try {
    TaskManager = require('expo-task-manager');
    BackgroundTask = require('expo-background-task');
  } catch (e) {
    console.warn('Arxa fon tapşırıqları əlçatan deyil', e);
  }
}
/* eslint-enable @typescript-eslint/no-require-imports */

// defineTask modul səviyyəsində olmalıdır — arxa fonda app UI-sız başlayanda da qeydə alınsın.
if (TaskManager && BackgroundTask && !TaskManager.isTaskDefined(TASK)) {
  const BT = BackgroundTask;
  TaskManager.defineTask(TASK, async () => {
    try {
      migrate();
      if (!useSettings.persist.hasHydrated()) await useSettings.persist.rehydrate();
      await i18n.changeLanguage(useSettings.getState().language);
      await refreshTracker();
      return BT.BackgroundTaskResult.Success;
    } catch (e) {
      console.warn('background task', e);
      return BT.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerBackgroundTracker(): Promise<void> {
  if (!TaskManager || !BackgroundTask) return;
  try {
    if (!(await TaskManager.isTaskRegisteredAsync(TASK))) {
      await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 15 });
    }
  } catch (e) {
    console.warn('registerBackgroundTracker', e);
  }
}
