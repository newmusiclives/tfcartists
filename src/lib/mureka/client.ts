/**
 * Mureka AI API client — sung music generation.
 *
 * Gated behind the MUREKA_API_KEY env var. If the key is missing, every
 * entry point throws a clear error so the station never silently no-ops.
 *
 * This client is only reachable when the project is running on the
 * Mureka API tier (starts around $30 pay-as-you-go). The cheaper
 * web-only $10 subscription does NOT issue API keys — for that path,
 * use drop/mureka-imaging/ + scripts/ingest-mureka-assets.ts instead.
 *
 * Docs: https://platform.mureka.ai/docs/
 */

const DEFAULT_BASE_URL = "https://api.mureka.ai";
const DEFAULT_MODEL = "V9";
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 180_000;

type MurekaJobState = "pending" | "running" | "succeeded" | "failed" | string;

interface MurekaSong {
  song_id: string;
  title: string;
  version: string;
  duration_milliseconds: number;
  mp3_url: string;
  genres?: string[];
  moods?: string[];
}

interface MurekaGenerateResponse {
  jobid: string;
  feed_id?: number;
  state?: number;
  songs?: MurekaSong[];
}

interface MurekaJobStatusResponse {
  jobid: string;
  state: MurekaJobState;
  songs?: MurekaSong[];
  error?: string;
}

export interface InstrumentalOptions {
  prompt: string;
  title?: string;
  model?: string;
  refId?: string;
}

export interface SongOptions {
  lyrics: string;
  prompt: string;
  title?: string;
  model?: string;
}

function requireApiKey(): string {
  const key = process.env.MUREKA_API_KEY;
  if (!key) {
    throw new Error(
      "MUREKA_API_KEY is not set. The Mureka API client requires the API tier ($30+ pay-as-you-go), " +
      "not the $10 web-only subscription. If you are on the web tier, use the drop-folder workflow " +
      "in drop/mureka-imaging/ instead.",
    );
  }
  return key;
}

function getBaseUrl(): string {
  return process.env.MUREKA_BASE_URL || DEFAULT_BASE_URL;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const apiKey = requireApiKey();
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Mureka ${path} → ${response.status}: ${text.slice(0, 500)}`);
  }
  return response.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const apiKey = requireApiKey();
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Mureka ${path} → ${response.status}: ${text.slice(0, 500)}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Generate an instrumental track (no vocals). Use this for sung sweepers'
 * music beds or for pure instrumental imaging.
 */
export async function generateInstrumental(opts: InstrumentalOptions): Promise<MurekaGenerateResponse> {
  return postJson<MurekaGenerateResponse>("/v1/music/create-instrumental", {
    prompt: opts.prompt,
    title: opts.title,
    model: opts.model ?? DEFAULT_MODEL,
    ref_id: opts.refId,
  });
}

/**
 * Generate a sung song with explicit lyrics. Use this for sung station IDs,
 * sung show jingles, and sung TOH bumpers.
 *
 * Note: Mureka currently generates 1+ minute outputs. For short imaging
 * (3-8 sec) you must trim the hook post-generation via ffmpeg — the
 * ingestion pipeline in scripts/ingest-mureka-assets.ts handles this.
 */
export async function generateSong(opts: SongOptions): Promise<MurekaGenerateResponse> {
  return postJson<MurekaGenerateResponse>("/v1/song/generate", {
    lyrics: opts.lyrics,
    prompt: opts.prompt,
    title: opts.title,
    model: opts.model ?? DEFAULT_MODEL,
  });
}

/**
 * Poll a generation job until it reaches a terminal state. Returns the
 * finished songs array or throws on failure / timeout.
 */
export async function waitForJob(jobId: string): Promise<MurekaSong[]> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const status = await getJson<MurekaJobStatusResponse>(`/v1/jobs/${jobId}`);
    if (status.state === "succeeded" && status.songs && status.songs.length > 0) {
      return status.songs;
    }
    if (status.state === "failed") {
      throw new Error(`Mureka job ${jobId} failed: ${status.error ?? "unknown error"}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Mureka job ${jobId} timed out after ${POLL_TIMEOUT_MS}ms`);
}

/**
 * Download a generated song's mp3 to a Buffer.
 */
export async function downloadSongMp3(song: MurekaSong): Promise<Buffer> {
  const response = await fetch(song.mp3_url);
  if (!response.ok) {
    throw new Error(`Failed to download Mureka mp3: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export function isMurekaConfigured(): boolean {
  return !!process.env.MUREKA_API_KEY;
}
