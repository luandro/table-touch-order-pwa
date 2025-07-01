import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslation from "./locales/en.json";
import ptTranslation from "./locales/pt.json";
import esTranslation from "./locales/es.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "pt",
    debug: false,
    resources: {
      pt: {
        translation: ptTranslation,
      },
      es: {
        translation: esTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "language",
      caches: ["localStorage"],
    },
  });

export default i18n;
