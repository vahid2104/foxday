import type { ExpenseCategory, Platform } from '@/db/money';
import type { ColorTokens } from '@/theme';

import type { IconName } from './Icon';

export const CATEGORY_ICONS: Record<ExpenseCategory, IconName> = {
  bike: 'bike',
  food: 'flame',
  phone: 'phone',
  home: 'home',
  transport: 'arrow-up-right',
  transfer: 'refresh',
  other: 'sparkle',
};

/** Platformaların qrafiklərdəki rəngi. */
export const PLATFORM_COLORS: Record<Platform, keyof ColorTokens> = {
  uber: 'accentBrand',
  glovo: 'accentSleep',
  wolt: 'accentWater',
  other: 'textSecondary',
};
