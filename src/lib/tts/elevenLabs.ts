/**
 * Server-only ElevenLabs TTS module.
 *
 * Maintains an in-memory round-robin pool of ElevenLabs API keys read from
 * environment variables (ELEVENLABS_API_KEY_1..N) and automatically rotates
 * to the next key on rate-limit / auth / quota / transient concurrency
 * failures. Keys are NEVER exposed to the client — this module is only ever
 * imported from server-side route handlers.
 *
 * !! Security: never log or return a key value anywhere in this module. !!
 */

export const DEFAULT_VOICE_ID = "EXAVITQu4vrwxnBUxP9w"; // Eleven "Rachel" (natural female)
export const DEFAULT_MODEL = "eleven_multilingual_v2";

export const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

/** Custom error types (do not embed secret data). */
export class TtsUnavailableError extends Error {
  constructor(message = "Voice service is not configured") {
    super(message);
    this.name = "TtsUnavailableError";
  }
}

export class TtsExhaustedError extends Error {
  constructor(message = "Voice service is temporarily busy") {
    super(message);
    this.name = "TtsExhaustedError";
  }
}

export class TtsError extends Error {
  status: number;
  constructor(status: number, message = `Voice service error (${status})`) {
    super(message);
    this.name = "TtsError";
    this.status = status;
  }
}

/**
 * Collects all configured ELEVENLABS_API_KEY_N keys from the environment.
 * Any key with a non-empty value is included; ordering is by N ascending.
 */
export function collectKeys(): string[] {
  const keys: string[] = [];
  let index = 1;
  for (;;) {
    const key = process.env[`ELEVENLABS_API_KEY_${index}`];
    if (key === undefined) {
      // A gap means no more keys are configured (e.g. only _1 and _2 set).
      break;
    }
    if (typeof key === "string" && key.trim().length > 0) {
      keys.push(key.trim());
    }
    index += 1;
  }
  return keys;
}

/** Module-level key pool + round-robin pointer. */
let keys: string[] | null = null;
let pointer = 0;

function getKeys(): string[] {
  if (keys === null) {
    keys = collectKeys();
  }
  return keys;
}

export function hasKeys(): boolean {
  return getKeys().length > 0;
}

export function keyCount(): number {
  return getKeys().length;
}

/**
 * Calls the ElevenLabs streaming TTS endpoint with a specific key and returns
 * the upstream Response (whose body is piped back to the client). Does NOT
 * retry — rotation is handled by synthesizeWithPool.
 */
async function callElevenLabs(
  apiKey: string,
  text: string,
  voice: string,
  model: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s guard

  const url = `${ELEVENLABS_ENDPOINT}/${encodeURIComponent(voice)}/stream?output_format=mp3_44100_128`;

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          speaker_boost: true,
        },
      }),
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Synthesizes speech using the round-robin key pool, rotating to a fresh key
 * on rate-limit / auth / quota / transient server failures or network errors.
 *
 * Rotates ONLY for status codes that a different key could plausibly fix
 * (429, 401, 403, 503, and any 5xx) and network failures. A 400-class response
 * caused by our own payload is returned as a TtsError without burning more
 * keys.
 *
 * Returns the upstream Response (body streamed by the caller).
 */
export async function synthesizeWithPool(
  text: string,
  voice: string = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID,
  model: string = process.env.ELEVENLABS_MODEL || DEFAULT_MODEL
): Promise<Response> {
  const pool = getKeys();
  if (pool.length === 0) {
    throw new TtsUnavailableError();
  }

  const attempts = pool.length; // try each key at most once per request
  let lastError: unknown = null;

  for (let i = 0; i < attempts; i += 1) {
    const keyIndex = (pointer + i) % pool.length;
    const candidate = pool[keyIndex];
    if (!candidate) continue; // defensive: noUncheckedIndexedAccess

    try {
      const response = await callElevenLabs(candidate, text, voice, model);

      if (response.ok) {
        // Advance pointer so the next request starts on a different key,
        // spreading load across the pool.
        pointer = (keyIndex + 1) % pool.length;
        return response;
      }

      const status = response.status;
      if (status === 429 || status === 401 || status === 403 || status === 503 || status >= 500) {
        // Rotate to next key — this key is rate-limited / invalid / unavailable.
        lastError = new TtsError(status, `ElevenLabs upstream returned ${status}`);
        continue;
      }

      // 400-class (our payload or the configured voice/model is invalid):
      // another key will not fix this. Surface it without burning the pool.
      throw new TtsError(status, `ElevenLabs rejected request (${status})`);
    } catch (err) {
      // Network / abort / timeout — transient, try the next key.
      lastError = err;
      continue;
    }
  }

  if (lastError instanceof TtsError) {
    throw new TtsError(lastError.status, lastError.message);
  }
  throw new TtsExhaustedError();
}
