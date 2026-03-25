"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  type Locale,
  type TranslationKey,
  DEFAULT_LOCALE,
  t as translateFn,
} from "@/lib/i18n/translations";

const STORAGE_KEY = "truefans-locale";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => translateFn(key, DEFAULT_LOCALE),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  // Load saved locale from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === "en" || saved === "es")) {
        setLocaleState(saved);
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode)
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // localStorage unavailable
    }
    // Set lang attribute on <html> for accessibility
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translateFn(key, locale),
    [locale]
  );

  // Avoid hydration mismatch: render children only after reading localStorage
  if (!hydrated) {
    return (
      <LanguageContext.Provider
        value={{ locale: DEFAULT_LOCALE, setLocale, t: (key) => translateFn(key, DEFAULT_LOCALE) }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
