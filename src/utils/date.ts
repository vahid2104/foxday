import type { Language } from '@/store/settings';

const WEEKDAYS: Record<Language, string[]> = {
  az: ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

const MONTHS: Record<Language, string[]> = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};

/** "Cümə axşamı, 15 oktyabr" kimi tarix. Telefonun Intl dəstəyindən asılı deyil. */
export function formatLongDate(date: Date, lang: Language): string {
  const wd = WEEKDAYS[lang][date.getDay()];
  const m = MONTHS[lang][date.getMonth()];
  return lang === 'en' ? `${wd}, ${m} ${date.getDate()}` : `${wd}, ${date.getDate()} ${m}`;
}

/** Dəqiqəni saat və dəqiqəyə ayırır: 435 → { h: 7, m: 15 }. */
export function splitMinutes(total: number) {
  return { h: Math.floor(total / 60), m: total % 60 };
}
