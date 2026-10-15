import { useDbVersion } from './index';

/**
 * Bazadan sinxron oxuyur və hər yazmadan sonra (notifyDbChanged) avtomatik yenilənir.
 * Nümunə: const totals = useDbQuery(() => getRangeTotals(from, to));
 *
 * Diqqət: React Compiler bu hook-u optimallaşdırmamalıdır. Əks halda "version" dəyişəndə
 * köhnə nəticəni keşdən qaytarır və ekran yenilənmir (2026-10-15 baq).
 */
export function useDbQuery<T>(query: () => T): T {
  'use no memo';
  // Baza dəyişəndə bu dəyər artır → komponent yenidən render olunur → sorğu yenidən işləyir.
  useDbVersion((s) => s.version);
  return query();
}
