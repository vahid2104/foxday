import type { Language } from '@/store/settings';

import { addDays, fromISODate, today } from './dates';

const WEEKDAYS: Record<Language, string[]> = {
  az: ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

/** Qısa həftə günləri, bazar ertəsindən başlayaraq. */
export const WEEKDAYS_SHORT: Record<Language, string[]> = {
  az: ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

/** Ayların adları: tarixdə işlənən forma (15 oktyabr). */
const MONTHS: Record<Language, string[]> = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};

/** Ayların adları: başlıq forması (Oktyabr 2026). */
const MONTHS_TITLE: Record<Language, string[]> = {
  az: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
  en: MONTHS.en,
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

/** "Cümə axşamı, 15 oktyabr" kimi tarix. Telefonun Intl dəstəyindən asılı deyil. */
export function formatLongDate(date: Date, lang: Language): string {
  const wd = WEEKDAYS[lang][date.getDay()];
  const m = MONTHS[lang][date.getMonth()];
  return lang === 'en' ? `${wd}, ${m} ${date.getDate()}` : `${wd}, ${date.getDate()} ${m}`;
}

/** "15 okt" */
export function formatShortDate(iso: string, lang: Language): string {
  const d = fromISODate(iso);
  const m = MONTHS[lang][d.getMonth()].slice(0, 3);
  return lang === 'en' ? `${m} ${d.getDate()}` : `${d.getDate()} ${m}`;
}

/** "Bu gün" / "Dünən" / "15 okt". */
export function formatRelativeDate(iso: string, lang: Language, labels: { today: string; yesterday: string }) {
  if (iso === today()) return labels.today;
  if (iso === addDays(today(), -1)) return labels.yesterday;
  return formatShortDate(iso, lang);
}

/** "Oktyabr 2026" */
export function formatMonthYear(year: number, month0: number, lang: Language): string {
  return `${MONTHS_TITLE[lang][month0]} ${year}`;
}

/** Dəqiqəni saat və dəqiqəyə ayırır: 435 → { h: 7, m: 15 }. */
export function splitMinutes(total: number) {
  return { h: Math.floor(total / 60), m: total % 60 };
}
