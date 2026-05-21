import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';

import fr from './translations/fr.json';
import ar from './translations/ar.json';

const LANGUAGE_KEY = 'QimatnaDz_Language';

const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
};

export const initI18n = async () => {
  // 1. Check if user already picked a language
  let savedLang = null;
  if (Platform.OS !== 'web') {
    savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  } else {
    savedLang = localStorage.getItem(LANGUAGE_KEY);
  }

  let defaultLang = 'fr';

  if (savedLang) {
    defaultLang = savedLang;
  } else {
    // 2. Otherwise detect device language
    const deviceLocales = Localization.getLocales();
    if (deviceLocales.length > 0) {
      const languageTag = deviceLocales[0].languageTag; // e.g. "ar-DZ"
      if (languageTag.startsWith('ar')) {
        defaultLang = 'ar';
      }
    }
  }

  // 3. Configure RTL safely (only applies to Native components)
  const isRTL = defaultLang === 'ar';
  
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // Usually requires app restart, handled at the UI layer (Settings)
  }

  // 4. Init i18next
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: defaultLang,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false, // react is already safe from xss
      },
    });
};

export const setLanguage = async (lang: 'fr' | 'ar') => {
  await i18n.changeLanguage(lang);
  
  if (Platform.OS !== 'web') {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } else {
    localStorage.setItem(LANGUAGE_KEY, lang);
  }

  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    
    // We will use expo-updates to reload the app in production, 
    // but in development we can instruct the user to reload.
  }
};

export default i18n;
