import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db';
import { minorToCsv, toCsv } from '@/lib/csv';
import { today } from '@/lib/dates';

export type ExportKind = 'money' | 'habits' | 'health';

function moneyCsv(): string {
  const rows = db.getAllSync<{
    kind: string; date: string; label: string; amount_minor: number; currency: string; rate: number; pln: number;
    duration_min: number | null; orders: number | null; km: number | null; note: string | null;
  }>(
    `SELECT 'gəlir' AS kind, date, platform AS label, amount_minor + tip_minor AS amount_minor, currency, rate_to_pln AS rate,
            amount_pln_minor AS pln, duration_min, orders, km, note FROM work_sessions
     UNION ALL
     SELECT 'xərc', date, category, amount_minor, currency, rate_to_pln, amount_pln_minor, NULL, NULL, NULL, note FROM expenses
     ORDER BY date`,
  );
  return toCsv(
    ['Növ', 'Tarix', 'Platforma/Kateqoriya', 'Məbləğ', 'Valyuta', 'Məzənnə', 'PLN', 'Dəqiqə', 'Sifariş', 'Km', 'Qeyd'],
    rows.map((r) => [
      r.kind, r.date, r.label, minorToCsv(r.amount_minor), r.currency, String(r.rate).replace('.', ','),
      minorToCsv(r.kind === 'xərc' ? -r.pln : r.pln), r.duration_min, r.orders, r.km, r.note,
    ]),
  );
}

function habitsCsv(): string {
  const rows = db.getAllSync<{ name: string; date: string; status: string }>(
    `SELECT h.name, l.date, l.status FROM habit_logs l JOIN habits h ON h.id = l.habit_id ORDER BY l.date, h.name`,
  );
  return toCsv(['Vərdiş', 'Tarix', 'Vəziyyət'], rows.map((r) => [r.name, r.date, r.status === 'done' ? 'edildi' : 'keçildi']));
}

function healthCsv(): string {
  const rows = db.getAllSync<{ date: string; water: number | null; sleep: number | null; quality: number | null; kcal: number | null; mood: number | null }>(
    `WITH days AS (
       SELECT date FROM water_logs UNION SELECT date FROM sleep_logs UNION SELECT date FROM food_logs UNION SELECT date FROM mood_logs
     )
     SELECT d.date,
       (SELECT SUM(ml) FROM water_logs w WHERE w.date = d.date) AS water,
       (SELECT duration_min FROM sleep_logs s WHERE s.date = d.date) AS sleep,
       (SELECT quality FROM sleep_logs s WHERE s.date = d.date) AS quality,
       (SELECT SUM(kcal) FROM food_logs f WHERE f.date = d.date) AS kcal,
       (SELECT mood FROM mood_logs m WHERE m.date = d.date) AS mood
     FROM days d ORDER BY d.date`,
  );
  return toCsv(['Tarix', 'Su (ml)', 'Yuxu (dəq)', 'Yuxu keyfiyyəti', 'Kalori', 'Əhval (1–5)'], rows.map((r) => [r.date, r.water, r.sleep, r.quality, r.kcal, r.mood]));
}

/** CSV faylını yaradır və paylaşma pəncərəsini açır (Gmail, Drive, Telegram...). */
export async function exportCsv(kind: ExportKind, dialogTitle: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  const content = kind === 'money' ? moneyCsv() : kind === 'habits' ? habitsCsv() : healthCsv();
  const file = new File(Paths.cache, `foxday-${kind}-${today()}.csv`);
  file.create({ overwrite: true });
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle });
  return true;
}
