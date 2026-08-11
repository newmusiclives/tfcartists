/**
 * Feature flag registry.
 *
 * Every flag must be declared here. That is deliberate: a registry makes flags
 * discoverable, gives the admin UI something to render, and stops them becoming
 * magic strings scattered through the codebase that nobody dares delete.
 *
 * NAMING: these are `flag:*` keys. Do not confuse them with radio "features"
 * (FeatureType/FeatureContent) which are on-air show segments - an unfortunate
 * collision that already exists in this codebase.
 *
 * To add a flag: add an entry here, then use `flag("my_flag")` on the server or
 * `useFlag("my_flag")` in a client component.
 */

export type FlagScope = "global" | "station";

export interface FlagDefinition {
  /** Human label for the admin UI */
  label: string;
  /** What turning this on actually does, and any cost implication */
  description: string;
  /** Value when nothing is configured anywhere */
  defaultValue: boolean;
  /** "station" flags may be overridden per station; "global" may not */
  scope: FlagScope;
  /** Grouping in the admin UI */
  category: "monetisation" | "programming" | "distribution" | "rights" | "platform";
  /** Set when a flag costs real money to run, so operators see it before enabling */
  costNote?: string;
}

export const FLAGS = {
  // --- Monetisation -------------------------------------------------------
  station_payments: {
    label: "Card payments",
    description:
      "Take real card payments for subscriptions, sponsorships and invoices. " +
      "With this off, billing surfaces still record amounts but nothing is charged.",
    defaultValue: false,
    scope: "global",
    category: "monetisation",
  },
  sponsor_self_serve: {
    label: "Sponsor self-serve",
    description:
      "Let advertisers submit copy, get an AI-voiced ad, schedule it and receive a play-report invoice, without a sales call.",
    defaultValue: false,
    scope: "station",
    category: "monetisation",
    costNote: "Each generated ad costs a TTS render.",
  },
  hq_stream: {
    label: "HQ 320k stream",
    description:
      "Offer 320kbps as a paid upgrade over the 128kbps base stream. Bandwidth is the only cost that scales with listener numbers.",
    defaultValue: false,
    scope: "station",
    category: "monetisation",
    costNote: "320kbps uses 2.5x the bandwidth of 128kbps per listener-hour.",
  },

  // --- Programming --------------------------------------------------------
  extra_djs: {
    label: "Extra DJ personalities",
    description:
      "Unlock DJs beyond the 4 included in a basic station. Each additional DJ needs its own voice library build.",
    defaultValue: false,
    scope: "station",
    category: "programming",
    costNote: "One-time TTS library build per DJ.",
  },
  signature_voices: {
    label: "Signature voices (ElevenLabs)",
    description:
      "Use ElevenLabs voices instead of the standard TTS provider for a premium sound.",
    defaultValue: false,
    scope: "station",
    category: "programming",
    costNote: "Roughly 20x the per-character cost of the standard provider.",
  },
  live_requests: {
    label: "Listener requests on air",
    description:
      "Feed listener requests and votes into the playout queue. The request UI already exists; this connects it to the scheduler.",
    defaultValue: false,
    scope: "station",
    category: "programming",
  },
  smart_clocks: {
    label: "Automatic clock building",
    description:
      "Build hour clocks automatically from BPM, cue-point and hit analysis rather than hand-assembling them.",
    defaultValue: false,
    scope: "station",
    category: "programming",
  },

  // --- Distribution -------------------------------------------------------
  podcast_replays: {
    label: "Podcast replays",
    description:
      "Publish each hour or show as a podcast episode. Segments are already generated audio, so this is reach at no extra AI cost.",
    defaultValue: false,
    scope: "station",
    category: "distribution",
  },
  artist_showcase: {
    label: "Public artist showcase",
    description:
      "A public page crediting the artists whose music is in rotation. Doubles as recruitment for the permissioned catalogue.",
    defaultValue: false,
    scope: "global",
    category: "distribution",
  },
  ai_show_recaps: {
    label: "AI show recaps and clips",
    description:
      "Generate written recaps and short social clips from each show, for the social posting queue.",
    defaultValue: false,
    scope: "station",
    category: "distribution",
    costNote: "One LLM call plus optional audio render per show.",
  },
  multi_station: {
    label: "Multiple stations",
    description:
      "Allow launching more than one station. Note: the playout API currently records a mock instance rather than starting a second stream.",
    defaultValue: false,
    scope: "global",
    category: "platform",
  },

  // --- Rights -------------------------------------------------------------
  rights_gate: {
    label: "Rights gate",
    description:
      "Only songs whose rights are cleared (owned AI, direct licence or public domain) may go to air. " +
      "Turning this on with an unreviewed catalogue takes the station silent immediately - which is correct, but should be a deliberate act.",
    defaultValue: false,
    scope: "global",
    category: "rights",
  },
  coming_soon: {
    label: "Coming-soon hold page",
    description:
      "Hide the entire site behind a launch placeholder. Middleware serves the hold page before any route renders, so nothing of the real site is reachable - not a page, not an API. " +
      "Signed-in admins are never gated, and COMING_SOON_BYPASS_TOKEN opens the site for one browser via ?preview=<token>. " +
      "Prefer setting FLAG_COMING_SOON in the environment: an env value takes the database out of the decision, so a database outage cannot quietly publish the site.",
    defaultValue: false,
    scope: "global",
    category: "platform",
  },
  listener_analytics: {
    label: "Listener analytics",
    description:
      "Scrape Icecast listener statistics into the platform for dashboards and per-listener billing.",
    defaultValue: false,
    scope: "global",
    category: "platform",
  },
} as const satisfies Record<string, FlagDefinition>;

export type FlagKey = keyof typeof FLAGS;

export const FLAG_KEYS = Object.keys(FLAGS) as FlagKey[];

export function isFlagKey(key: string): key is FlagKey {
  return key in FLAGS;
}

/** Storage key for a flag, optionally scoped to one station. */
export function flagConfigKey(key: FlagKey, stationId?: string | null): string {
  return stationId ? `flag:${key}:station:${stationId}` : `flag:${key}`;
}

/** Emergency environment override, e.g. FLAG_RIGHTS_GATE=true */
export function flagEnvKey<K extends FlagKey>(key: K): `FLAG_${Uppercase<K>}` {
  return `FLAG_${key.toUpperCase() as Uppercase<K>}`;
}
