import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pt from './locales/pt.json';
import en from './locales/en.json';

const LANG_KEY = 'userLanguage';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'pt';
const defaultLang: 'pt' | 'en' = deviceLocale === 'en' ? 'en' : 'pt';

i18n
  .use(initReactI18next)
  .init({
    lng: defaultLang,
    fallbackLng: 'pt',
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

/** Call once on app start — applies any persisted language preference. */
export async function loadAndApplyLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANG_KEY);
    if (stored === 'pt' || stored === 'en') {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // Storage unavailable — keep device default
  }
}

/** Persist and apply a language preference. */
export async function changeLanguage(lang: 'pt' | 'en'): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
