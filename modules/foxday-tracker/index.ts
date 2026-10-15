import { requireOptionalNativeModule } from 'expo';

export type AppUsage = { packageName: string; label: string; ms: number };
export type UsageResult = { apps: AppUsage[]; unlocks: number };

type FoxdayTrackerModule = {
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  getUsage(startMs: number, endMs: number): UsageResult;
  hasStepSensor(): boolean;
  getStepCounter(): Promise<number>;
};

/**
 * Yerli Kotlin modulu (modules/foxday-tracker/android).
 * Expo Go-da yoxdur → null qaytarır; app bunu "APK-da işləyəcək" kimi göstərir.
 */
const Tracker = requireOptionalNativeModule<FoxdayTrackerModule>('FoxdayTracker');

export default Tracker;
