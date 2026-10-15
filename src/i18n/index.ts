import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import az from './locales/az';
import en from './locales/en';
import ru from './locales/ru';

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: {
    az: { translation: az },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: 'az',
  fallbackLng: 'az',
  interpolation: { escapeValue: false },
});

export default i18n;
