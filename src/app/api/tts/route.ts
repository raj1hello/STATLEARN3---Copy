import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { sanitizeInput } from "@/lib/sanitize";
import { ok, fail, handleError } from "@/lib/apiResponse";
import {
  synthesizeWithPool,
  hasKeys,
  TtsUnavailableError,
  TtsExhaustedError,
  TtsError,
  DEFAULT_VOICE_ID,
  DEFAULT_MODEL,
} from "@/lib/tts/elevenLabs";

const TtsSchema = z.object({
  text: z.string().min(1, "Text is required").max(4000, "Text is too long"),
  voice: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
});

/**
 * GET /api/tts
 * Lightweight availability probe. Returns a non-secret boolean so the client
 * knows whether voice buttons are worth showing. Never exposes key values.
 */
export async function GET() {
  return ok({ available: hasKeys() });
}

/**
 * POST /api/tts
 * Synthesizes speech via the server-side ElevenLabs key pool and streams the
 * MP3 back. Authentication is required to prevent anonymous cost/quota abuse.
 * Keys never leave the server.
 */
export async function POST(request: Request) {
  try {
    // Mandatory auth — every synthesis call costs quota/money.
    await requireSession(request);

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = TtsSchema.parse(cleanBody);

    const voice = parsed.voice || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
    const model = parsed.model || process.env.ELEVENLABS_MODEL || DEFAULT_MODEL;

    const upstream = await synthesizeWithPool(parsed.text, voice, model);

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof TtsUnavailableError) {
      return fail("TTS_UNAVAILABLE", "Voice service is not configured", 503);
    }
    if (error instanceof TtsExhaustedError) {
      return fail("TTS_UNAVAILABLE", "Voice service is temporarily busy", 429);
    }
    if (error instanceof TtsError) {
      return fail("TTS_ERROR", error.message, error.status || 500);
    }
    return handleError(error);
  }
}
