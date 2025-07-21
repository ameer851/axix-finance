import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to CaraxFinance!',
      // ... add more keys as needed
    }
  },
  fr: {
    translation: {
      welcome: 'Bienvenue à CaraxFinance!',
    }
  },
  es: {
    translation: {
      welcome: '¡Bienvenido a CaraxFinance!',
    }
  },
  de: {
    translation: {
      welcome: 'Willkommen bei CaraxFinance!',
    }
  },
  ar: {
    translation: {
      welcome: 'مرحبًا بكم في CaraxFinance!',
    }
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
