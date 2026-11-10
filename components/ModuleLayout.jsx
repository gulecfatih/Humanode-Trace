'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Box, LoadingOverlay } from '@mantine/core';
import { useLanguage } from './LanguageContext';

const ModuleContext = createContext({
  page: 'overview',
  fields: {},
  t: (key, params, fallback) => key,
  loading: false,
  reload: () => {},
});

/**
 * ModuleLayout
 * Sarmallayıcı Layout Modülü:
 * 1. Sayfa (activeTab) veya dil (lang) her değiştiğinde C# Kestrel SQL API'sine (/api/localization/page) istek atar.
 * 2. SQLite'tan gelen en güncel alanları (fields) yükler.
 * 3. ModuleContext ile tüm alt modüllere (Overview, Whales, Validators, Biomapper vb.) aktarır.
 * 4. Alt bileşenler if/else yapmadan doğrudan fields[key] veya t(key) ile veritabanından beslenir.
 */
export function ModuleLayout({ activeTab = 'overview', children }) {
  const { lang, t: globalT } = useLanguage();
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({});

  const loadPageFields = useCallback((pageName, langCode) => {
    const cleanPage = (pageName || 'overview').toLowerCase();
    const cleanLang = (langCode || '').toLowerCase();
    const cacheKey = `${cleanPage}_${cleanLang}`;

    // Instant local memory restore to prevent UI flickering
    if (cacheRef.current[cacheKey]) {
      setFields(cacheRef.current[cacheKey]);
    } else {
      try {
        const localCached = localStorage.getItem(`hmnd_pf_${cacheKey}`);
        if (localCached) {
          const parsed = JSON.parse(localCached);
          cacheRef.current[cacheKey] = parsed;
          setFields(parsed);
        }
      } catch {}
    }

    setLoading(true);

    // Dynamic C# SQL API request
    fetch(`/api/localization/page?page=${encodeURIComponent(cleanPage)}&lang=${encodeURIComponent(cleanLang)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.fields) {
          setFields(data.fields);
          cacheRef.current[cacheKey] = data.fields;
          try {
            localStorage.setItem(`hmnd_pf_${cacheKey}`, JSON.stringify(data.fields));
          } catch {}
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn(`Failed to fetch page fields for [${cleanPage}] (${cleanLang}):`, err);
        setLoading(false);
      });
  }, []);

  // Whenever activeTab or lang changes, fetch the fresh page fields from C# SQL API
  useEffect(() => {
    loadPageFields(activeTab, lang);
  }, [activeTab, lang, loadPageFields]);

  // Context translation helper with parameter interpolation
  const tField = useCallback(
    (key, params = {}, fallback = '') => {
      if (!key) return '';
      let str = fields?.[key] || globalT(key) || fallback || key;
      if (params && typeof params === 'object') {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
      }
      return str;
    },
    [fields, globalT]
  );

  return (
    <ModuleContext.Provider
      value={{
        page: activeTab,
        fields,
        t: tField,
        loading,
        reload: () => loadPageFields(activeTab, lang),
      }}
    >
      <Box style={{ width: '100%', minHeight: '100%', position: 'relative' }}>
        {children}
      </Box>
    </ModuleContext.Provider>
  );
}

export function useModuleFields() {
  return useContext(ModuleContext);
}
