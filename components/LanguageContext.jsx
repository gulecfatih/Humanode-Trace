'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAppLocale } from './formatters';
import { Select, Text, Group } from '@mantine/core';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';

// Default initial languages list (loaded and kept in sync with app_languages via API)
export const DEFAULT_LANGUAGES = [
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe', nativeName: 'Türkçe', country: 'Türkiye', isDefault: true },
  { code: 'en', flag: '🇬🇧', label: 'English', nativeName: 'English', country: 'Global / UK', isDefault: false },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch', nativeName: 'Deutsch', country: 'Deutschland', isDefault: false },
  { code: 'ru', flag: '🇷🇺', label: 'Русский', nativeName: 'Русский', country: 'Россия', isDefault: false },
  { code: 'es', flag: '🇪🇸', label: 'Español', nativeName: 'Español', country: 'España', isDefault: false },
  { code: 'zh', flag: '🇨🇳', label: '简体中文', nativeName: '简体中文', country: '中国', isDefault: false },
];

export const SUPPORTED_LANGUAGES = DEFAULT_LANGUAGES;

const LanguageContext = createContext({
  lang: 'tr',
  languages: DEFAULT_LANGUAGES,
  setLang: () => {},
  t: (key) => key,
  loading: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('tr');
  const [languages, setLanguages] = useState(DEFAULT_LANGUAGES);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Initial Load: Check localStorage and fetch languages from API
  useEffect(() => {
    let initialLang = '';
    let savedLang = null;
    try {
      savedLang = localStorage.getItem('hmnd_lang');
      if (savedLang) {
        initialLang = savedLang;
        setLangState(savedLang);
        setAppLocale(savedLang);

        const cached = localStorage.getItem(`hmnd_translations_${initialLang}`) || localStorage.getItem(`hmnd_sql_trans_${initialLang}`);
        if (cached) {
          setTranslations(JSON.parse(cached));
        }
      }
    } catch (e) {
      console.warn('Locale storage read warning:', e);
    }

    // Fetch supported languages dynamically from API
    fetch('/api/languages')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLanguages(data);
          const defaultLangObj = data.find((l) => l.isDefault || l.IsDefault) || data[0];
          const defaultCode = (defaultLangObj?.code || defaultLangObj?.Code || '').toLowerCase();

          const activeCode = savedLang || defaultCode;
          if (activeCode) {
            setLangState(activeCode);
            setAppLocale(activeCode);
            loadTranslationsFromApi(activeCode);
          }
        }
      })
      .catch((err) => console.error('Failed to load API languages:', err));
  }, []);

  // 2. Fetch translations for specific language from backend API
  const loadTranslationsFromApi = useCallback((targetLang) => {
    setLoading(true);
    fetch(`/api/translations?lang=${encodeURIComponent(targetLang)}`)
      .then((res) => res.json())
      .then((data) => {
        let dict = {};
        if (Array.isArray(data)) {
          data.forEach((item) => {
            const k = item.key || item.Key;
            const v = item.value !== undefined ? item.value : item.Value;
            if (k) dict[k] = v;
          });
        } else if (data && typeof data === 'object') {
          dict = data;
        }
        setTranslations(dict);
        try {
          localStorage.setItem(`hmnd_translations_${targetLang}`, JSON.stringify(dict));
        } catch {}
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to fetch API translations for ${targetLang}:`, err);
        setLoading(false);
      });
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    setAppLocale(newLang);
    try {
      localStorage.setItem('hmnd_lang', newLang);
      const cached = localStorage.getItem(`hmnd_translations_${newLang}`) || localStorage.getItem(`hmnd_sql_trans_${newLang}`);
      if (cached) {
        setTranslations(JSON.parse(cached));
      }
    } catch {}

    loadTranslationsFromApi(newLang);
  };

  const t = useCallback(
    (key, params = {}) => {
      let str = translations?.[key] || key;
      if (params && typeof params === 'object') {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
      }
      return str;
    },
    [translations]
  );

  return (
    <LanguageContext.Provider value={{ lang, languages, setLang, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher({ size = 'sm' }) {
  const { lang, languages, setLang, t } = useLanguage();
  const activeList = languages && languages.length > 0 ? languages : DEFAULT_LANGUAGES;

  const selectData = activeList.map((item) => ({
    value: item.code,
    label: `${item.flag} ${item.nativeName || item.label}`,
  }));

  return (
    <Select
      size={size}
      value={lang || 'tr'}
      onChange={(val) => val && setLang(val)}
      data={selectData}
      allowDeselect={false}
      checkIconPosition="right"
      aria-label={t('selectLanguage') || 'Dil Seçimi'}
      comboboxProps={{ shadow: 'md', transitionProps: { transition: 'pop', duration: 150 }, zIndex: 1000 }}
      style={{ width: 140 }}
      styles={{
        input: {
          backgroundColor: '#fff1e5',
          border: '1px solid #111111',
          borderRadius: 0,
          color: '#111111',
          fontWeight: 700,
          fontSize: 12,
          fontFamily: "var(--font-sans), 'Inter', sans-serif",
          cursor: 'pointer',
          height: 36,
        },
        dropdown: {
          backgroundColor: '#fff1e5',
          border: '2px solid #111111',
          borderRadius: 0,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        },
        option: {
          color: '#111111',
          fontWeight: 600,
          fontSize: 12,
          padding: '8px 10px',
          borderRadius: 0,
        },
      }}
    />
  );
}
