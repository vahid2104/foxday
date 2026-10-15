/** Tarix köməkçiləri. Tarixlər bazada yerli vaxtla "YYYY-MM-DD" formatında saxlanılır. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function today(): string {
  return toISODate(new Date());
}

/** Həftənin bazar ertəsi (Azərbaycan/Polşa: həftə bazar ertəsi başlayır). */
export function startOfWeek(iso: string): string {
  const d = fromISODate(iso);
  const dow = (d.getDay() + 6) % 7; // B.e = 0
  return addDays(iso, -dow);
}

export function monthRange(year: number, month0: number): { from: string; to: string } {
  const from = toISODate(new Date(year, month0, 1));
  const to = toISODate(new Date(year, month0 + 1, 0));
  return { from, to };
}

/** Date obyektindən "HH:MM". */
export function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function hhmmToDate(hhmm: string, base = new Date()): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/** İki tarix arasındakı gün fərqi (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86400000);
}
