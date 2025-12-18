import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enTasks from './locales/en/tasks.json';
import enReports from './locales/en/reports.json';
import enKpis from './locales/en/kpis.json';

import esCommon from './locales/es/common.json';
import esDashboard from './locales/es/dashboard.json';
import esTasks from './locales/es/tasks.json';
import esReports from './locales/es/reports.json';
import esKpis from './locales/es/kpis.json';

import ptBRCommon from './locales/pt-BR/common.json';
import ptBRDashboard from './locales/pt-BR/dashboard.json';
import ptBRTasks from './locales/pt-BR/tasks.json';
import ptBRReports from './locales/pt-BR/reports.json';
import ptBRKpis from './locales/pt-BR/kpis.json';

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    tasks: enTasks,
    reports: enReports,
    kpis: enKpis
  },
  es: {
    common: esCommon,
    dashboard: esDashboard,
    tasks: esTasks,
    reports: esReports,
    kpis: esKpis
  },
  'pt-BR': {
    common: ptBRCommon,
    dashboard: ptBRDashboard,
    tasks: ptBRTasks,
    reports: ptBRReports,
    kpis: ptBRKpis
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pt-BR'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'taskmaster_language'
    },

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: true
    }
  });

export default i18n;
