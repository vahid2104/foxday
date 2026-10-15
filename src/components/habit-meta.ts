import type { HabitColor } from '@/db/habits';
import type { ColorTokens } from '@/theme';

/** Vərdiş rənginin ikon və fon tokenləri. */
export const HABIT_COLOR_TOKENS: Record<HabitColor, { fg: keyof ColorTokens; bg: keyof ColorTokens }> = {
  brand: { fg: 'textBrand', bg: 'bgBrandSubtle' },
  success: { fg: 'accentSuccess', bg: 'bgSuccessSubtle' },
  water: { fg: 'accentWater', bg: 'bgWaterSubtle' },
  sleep: { fg: 'accentSleep', bg: 'bgSleepSubtle' },
  danger: { fg: 'accentDanger', bg: 'bgDangerSubtle' },
};

/** Rəng seçimində göstərilən dolğun rəng. */
export const HABIT_COLOR_SOLID: Record<HabitColor, keyof ColorTokens> = {
  brand: 'accentBrand',
  success: 'accentSuccess',
  water: 'accentWater',
  sleep: 'accentSleep',
  danger: 'accentDanger',
};
