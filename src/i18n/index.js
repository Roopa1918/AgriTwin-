// AgriTwin — i18n Translation Index
import en from './translations/en';
import kn from './translations/kn';
import hi from './translations/hi';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
];

export const translations = {
  en,
  kn,
  hi
};

export default translations;

