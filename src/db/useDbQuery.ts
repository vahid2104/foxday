import { useMemo } from 'react';

import { useDbVersion } from './index';

/**
 * Bazadan sinxron oxuyur və hər yazmadan sonra (notifyDbChanged) avtomatik yenilənir.
 * Nümunə: const totals = useDbQuery(() => getRangeTotals(from, to));
 */
export function useDbQuery<T>(query: () => T): T {
  const version = useDbVersion((s) => s.version);
  return useMemo(() => {
    void version; // baza dəyişəndə yenidən oxu
    return query();
  }, [query, version]);
}
