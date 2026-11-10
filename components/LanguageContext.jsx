'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAppLocale } from './formatters';
import { Menu, Button, Text, Group } from '@mantine/core';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';

// Default initial languages list (loaded and kept in sync with SQLite app_languages)
export const DEFAULT_LANGUAGES = [];

export const SUPPORTED_LANGUAGES = DEFAULT_LANGUAGES;

const LanguageContext = createContext({
  lang: '',
  languages: [],
  setLang: () => {},
  t: (key) => key,
  loading: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('');
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Initial Load: Check localStorage and fetch languages from SQLite
  useEffect(() => {
    let initialLang = '';
    let savedLang = null;
    try {
      savedLang = localStorage.getItem('hmnd_lang');
      if (savedLang) {
        initialLang = savedLang;
        setLangState(savedLang);
        setAppLocale(savedLang);

        const cached = localStorage.getItem(`hmnd_sql_trans_${initialLang}`);
        if (cached) {
          setTranslations(JSON.parse(cached));
        }
      }
    } catch (e) {
      console.warn('Locale storage read warning:', e);
    }

    // Fetch supported languages dynamically from SQLite
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
            loadTranslationsFromSql(activeCode);
          }
        }
      })
      .catch((err) => console.error('Failed to load SQL languages:', err));
  }, []);

  // 2. Fetch translations for specific language from SQLite backend
  const loadTranslationsFromSql = useCallback((targetLang) => {
    setLoading(true);
    fetch(`/api/translations?lang=${encodeURIComponent(targetLang)}`)
      .then((res) => res.json())
      .then((dict) => {
        if (dict && typeof dict === 'object') {
          setTranslations(dict);
          try {
            localStorage.setItem(`hmnd_sql_trans_${targetLang}`, JSON.stringify(dict));
          } catch {}
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to fetch SQL translations for ${targetLang}:`, err);
        setLoading(false);
      });
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    setAppLocale(newLang);
    try {
      localStorage.setItem('hmnd_lang', newLang);
      const cached = localStorage.getItem(`hmnd_sql_trans_${newLang}`);
      if (cached) {
        setTranslations(JSON.parse(cached));
      }
    } catch {}

    loadTranslationsFromSql(newLang);
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

export function LanguageSwitcher({ size = 'xs' }) {
  const { lang, languages, setLang, t } = useLanguage();
  const currentLang = languages.find((l) => l.code === lang) || languages[0] || { flag: '🌐', label: '', nativeName: '' };

  return (
    <Menu shadow="md" width={220} position="bottom-end" withArrow offset={6}>
      <Menu.Target>
        <Button
          variant="default"
          size={size}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.14)',
            color: '#f0f6fc',
            paddingLeft: 8,
            paddingRight: 8,
            borderRadius: 8,
          }}
          leftSection={<Text size="sm">{currentLang?.flag || '🌐'}</Text>}
          rightSection={<IconChevronDown size={13} style={{ opacity: 0.7 }} />}
        >
          <Text size="xs" fw={600}>
            {currentLang?.nativeName || currentLang?.label || ''}
          </Text>
        </Button>
      </Menu.Target>

      <Menu.Dropdown
        style={{
          background: '#161b22',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.65)',
        }}
      >
        <Menu.Label style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
          {t('selectLanguage')}
        </Menu.Label>
        {languages.map((item) => {
          const isSelected = item.code === lang;
          return (
            <Menu.Item
              key={item.code}
              onClick={() => setLang(item.code)}
              leftSection={<Text size="md">{item.flag}</Text>}
              rightSection={isSelected ? <IconCheck size={14} color="#38bdf8" /> : null}
              style={{
                backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? '#38bdf8' : '#f0f6fc',
                borderRadius: 6,
                marginBottom: 2,
              }}
            >
              <Group gap="xs" justify="space-between" wrap="nowrap">
                <Text size="xs" fw={isSelected ? 700 : 500}>
                  {item.nativeName || item.label}
                </Text>
                <Text size="10px" c="dimmed">
                  {item.label}
                </Text>
              </Group>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
