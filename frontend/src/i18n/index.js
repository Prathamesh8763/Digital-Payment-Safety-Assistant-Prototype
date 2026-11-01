import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.js';
import hi from './locales/hi.js';
import hinglish from './locales/hinglish.js';

const STORAGE_KEY = 'clearpay_language';
const SUPPORTED_LANGS = ['en', 'hi', 'hinglish'];

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
  } catch {
    // LocalStorage blocked or restricted
  }
  return 'en';
}

const initialLang = getInitialLanguage();

// Sync HTML document lang for accessibility
function updateDocumentLang(lang) {
  if (typeof document !== 'undefined') {
    if (lang === 'hi') {
      document.documentElement.lang = 'hi';
    } else if (lang === 'hinglish') {
      document.documentElement.lang = 'hi-Latn';
    } else {
      document.documentElement.lang = 'en';
    }
  }
}

updateDocumentLang(initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      hinglish: { translation: hinglish }
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already protects against XSS
    }
  });

// Listen for language changes to update localStorage & html attribute
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // LocalStorage write failed
  }
  updateDocumentLang(lng);
});

export default i18n;
