/**
 * Multi-Language (i18n) Translation System
 *
 * Lightweight, type-safe translations for TrueFans Radio.
 * Operators can extend by adding new locale keys and translation entries.
 */

export type Locale = "en" | "es";

export const SUPPORTED_LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export const DEFAULT_LOCALE: Locale = "en";

const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.schedule": "Schedule",
    "nav.djs": "DJs",
    "nav.listen": "Listen",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.dashboard": "Dashboard",
    "nav.settings": "Settings",

    // Player
    "player.nowPlaying": "Now Playing",
    "player.listenLive": "Listen Live",
    "player.volume": "Volume",
    "player.mute": "Mute",
    "player.unmute": "Unmute",
    "player.pause": "Pause",
    "player.play": "Play",
    "player.stop": "Stop",
    "player.buffering": "Buffering...",
    "player.offline": "Stream Offline",

    // Station
    "station.name": "Station Name",
    "station.tagline": "Tagline",
    "station.genre": "Genre",
    "station.requestSong": "Request a Song",
    "station.onAir": "On Air",
    "station.offAir": "Off Air",
    "station.listeners": "Listeners",
    "station.upNext": "Up Next",

    // Sponsor
    "sponsor.become": "Become a Sponsor",
    "sponsor.localHero": "Local Hero",
    "sponsor.businessName": "Business Name",
    "sponsor.submit": "Submit",
    "sponsor.tiers": "Sponsorship Tiers",
    "sponsor.thankYou": "Thank you for sponsoring!",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.back": "Back",
    "common.next": "Next",
    "common.search": "Search",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.submit": "Submit",
    "common.noResults": "No results found",

    // Rewards / Gamification
    "rewards.earnPoints": "Earn Points",
    "rewards.leaderboard": "Leaderboard",
    "rewards.redeem": "Redeem",
    "rewards.points": "Points",
    "rewards.rank": "Rank",
    "rewards.streak": "Listening Streak",

    // Chat
    "chat.withDj": "Chat with DJ",
    "chat.send": "Send",
    "chat.typeMessage": "Type a message...",
    "chat.online": "Online",
    "chat.offline": "Offline",
  },

  es: {
    // Navigation
    "nav.home": "Inicio",
    "nav.schedule": "Horario",
    "nav.djs": "DJs",
    "nav.listen": "Escuchar",
    "nav.login": "Iniciar Sesión",
    "nav.logout": "Cerrar Sesión",
    "nav.about": "Acerca de",
    "nav.contact": "Contacto",
    "nav.dashboard": "Panel",
    "nav.settings": "Configuración",

    // Player
    "player.nowPlaying": "Reproduciendo Ahora",
    "player.listenLive": "Escuchar en Vivo",
    "player.volume": "Volumen",
    "player.mute": "Silenciar",
    "player.unmute": "Activar Sonido",
    "player.pause": "Pausar",
    "player.play": "Reproducir",
    "player.stop": "Detener",
    "player.buffering": "Cargando...",
    "player.offline": "Transmisión Fuera de Línea",

    // Station
    "station.name": "Nombre de Estación",
    "station.tagline": "Eslogan",
    "station.genre": "Género",
    "station.requestSong": "Solicitar una Canción",
    "station.onAir": "Al Aire",
    "station.offAir": "Fuera del Aire",
    "station.listeners": "Oyentes",
    "station.upNext": "A Continuación",

    // Sponsor
    "sponsor.become": "Conviértete en Patrocinador",
    "sponsor.localHero": "Héroe Local",
    "sponsor.businessName": "Nombre del Negocio",
    "sponsor.submit": "Enviar",
    "sponsor.tiers": "Niveles de Patrocinio",
    "sponsor.thankYou": "¡Gracias por patrocinar!",

    // Common
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.back": "Atrás",
    "common.next": "Siguiente",
    "common.search": "Buscar",
    "common.close": "Cerrar",
    "common.confirm": "Confirmar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.view": "Ver",
    "common.submit": "Enviar",
    "common.noResults": "No se encontraron resultados",

    // Rewards / Gamification
    "rewards.earnPoints": "Ganar Puntos",
    "rewards.leaderboard": "Tabla de Líderes",
    "rewards.redeem": "Canjear",
    "rewards.points": "Puntos",
    "rewards.rank": "Rango",
    "rewards.streak": "Racha de Escucha",

    // Chat
    "chat.withDj": "Chatear con DJ",
    "chat.send": "Enviar",
    "chat.typeMessage": "Escribe un mensaje...",
    "chat.online": "En Línea",
    "chat.offline": "Desconectado",
  },
} as const;

/** Union of all valid translation keys */
export type TranslationKey = keyof typeof translations.en;

/**
 * Type-safe translation lookup.
 * Returns the translated string for the given key and locale.
 * Falls back to English if the key is missing in the requested locale.
 */
export function t(key: TranslationKey, locale: Locale = DEFAULT_LOCALE): string {
  const localeStrings = translations[locale];
  if (localeStrings && key in localeStrings) {
    return localeStrings[key];
  }
  // Fallback to English
  return translations.en[key] ?? key;
}

/** Get all translations for a locale (useful for bulk operations) */
export function getTranslations(locale: Locale) {
  return translations[locale] ?? translations.en;
}
