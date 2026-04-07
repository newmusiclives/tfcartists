/**
 * Canonical voice name → provider mapping.
 *
 * Used to normalize the `ttsProvider` column when a voice is selected via
 * UI pickers that don't always update the provider field correctly. The
 * runtime audio path (voice-track-tts.ts) treats legacy "elevenlabs" as
 * Gemini, but persisting the right provider keeps the editor + admin UIs
 * honest and avoids surprises.
 */

export const GEMINI_VOICE_NAMES = new Set([
  // Female
  "Zephyr", "Kore", "Leda", "Aoede", "Autonoe", "Callirhoe", "Despina",
  "Erinome", "Gacrux", "Laomedeia", "Pulcherrima", "Vindemiatrix", "Achernar",
  // Male
  "Puck", "Charon", "Fenrir", "Orus", "Achird", "Algenib", "Algieba",
  "Alnilam", "Enceladus", "Iapetus", "Rasalgethi", "Sadachbia", "Sadaltager",
  "Schedar", "Umbriel", "Zubenelgenubi",
]);

export const OPENAI_VOICE_NAMES = new Set([
  "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer",
]);

export type TtsProvider = "gemini" | "openai";

/**
 * Resolve the correct ttsProvider for a given voice name. Returns null if
 * the voice name is unrecognized (caller should leave the existing provider
 * untouched).
 */
export function resolveTtsProvider(voice: string | null | undefined): TtsProvider | null {
  if (!voice) return null;
  if (GEMINI_VOICE_NAMES.has(voice)) return "gemini";
  if (OPENAI_VOICE_NAMES.has(voice.toLowerCase())) return "openai";
  return null;
}

export function isGeminiVoice(voice: string | null | undefined): boolean {
  return !!voice && GEMINI_VOICE_NAMES.has(voice);
}
