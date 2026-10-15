/**
 * CSV yaradılması. Ayırıcı ";" — Polşa/Avropa Excel-i bunu avtomatik tanıyır.
 * Fayl UTF-8 BOM ilə başlayır ki, Excel "ə, ğ, ş" hərflərini düzgün göstərsin.
 */
export const CSV_BOM = '﻿';
const SEP = ';';

function cell(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return CSV_BOM + [header, ...rows].map((r) => r.map(cell).join(SEP)).join('\r\n') + '\r\n';
}

/** Qəpik → "248,50" (Excel-də rəqəm kimi oxunur) */
export function minorToCsv(minor: number): string {
  return (minor / 100).toFixed(2).replace('.', ',');
}
