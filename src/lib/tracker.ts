/**
 * Ekran vaxtı və addımlar üçün təmiz məntiq (testlənir, telefona bağlı deyil).
 */

export type StepState = { lastCounter: number; lastDate: string };

/** Bir oxunuşda ağlabatan maksimum artım — sensor xətası olarsa saymırıq. */
const MAX_DELTA = 100_000;

/**
 * Android-in addım sensoru telefon yandırılandan bəri ümumi sayı verir.
 * Biz hər oxunuşda əvvəlki ilə fərqi tapıb həmin günə əlavə edirik.
 *  - İlk oxunuş: yalnız başlanğıc nöqtəsi, heç nə əlavə olunmur.
 *  - Sayğac azalıbsa: telefon yenidən başladılıb → yeni dəyərin özü artımdır.
 */
export function applyStepReading(
  state: StepState | null,
  counter: number,
  date: string,
): { add: number; state: StepState } {
  const next = { lastCounter: counter, lastDate: date };
  if (counter < 0) return { add: 0, state: state ?? next };
  if (!state) return { add: 0, state: next };
  const delta = counter < state.lastCounter ? counter : counter - state.lastCounter;
  return { add: delta > MAX_DELTA ? 0 : delta, state: next };
}

/** Orta addım uzunluğu ~0.75 m */
export const stepsToKm = (steps: number) => Math.round((steps * 0.75) / 100) / 10;

/**
 * Təxmini yandırılan kalori: gəzinti (~0.04 kkal/addım) + velosiped işi (~4.5 kkal/dəq, e-bike).
 */
export const activeKcal = (steps: number, workMinutes: number) => Math.round(steps * 0.04 + workMinutes * 4.5);

/** Limitə görə xəbərdarlıq səviyyəsi: 0 — yox, 80 — yaxınlaşır, 100 — keçdi. */
export function limitLevel(usedMin: number, limitMin: number): 0 | 80 | 100 {
  if (limitMin <= 0) return 0;
  if (usedMin >= limitMin) return 100;
  if (usedMin >= limitMin * 0.8) return 80;
  return 0;
}

/** Günün başlanğıcı (yerli vaxt) ms ilə. */
export function startOfDayMs(d = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
