import { formatAmount } from '@/lib/money';

/** Ayarlarda və onboarding-də hədəflərin göstərilməsi. */
export const formatLiters = (ml: number) => `${String(ml / 1000).replace('.', ',')} L`;
export const formatHours = (min: number, unit: string) => `${String(Math.round((min / 60) * 10) / 10).replace('.', ',')} ${unit}`;
export const formatPln = (pln: number) => `${formatAmount(pln * 100)} PLN`;
