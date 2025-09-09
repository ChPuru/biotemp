// frontend/src/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';
import hi from './translations/hi.json';
import ta from './translations/ta.json';
import ml from './translations/ml.json';
import bn from './translations/bn.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ta: { translation: ta },
      ml: { translation: ml },
      bn: { translation: bn },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;