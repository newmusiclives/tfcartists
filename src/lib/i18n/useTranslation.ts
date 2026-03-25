"use client";

import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Convenience hook for i18n translations.
 *
 * Usage:
 *   const { t, locale, setLocale } = useTranslation();
 *   <h1>{t("player.nowPlaying")}</h1>
 */
export function useTranslation() {
  const { locale, setLocale, t } = useLanguage();
  return { t, locale, setLocale };
}
