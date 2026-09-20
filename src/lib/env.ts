import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

// Define the schema for environment variables
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_PROVIDER_API_KEY: z.string().optional(),
  AI_PROVIDER_BASE_URL: z.string().url().optional(),
  AI_PROVIDER_MODEL: z.string().optional(),
  // ElevenLabs TTS (all optional; the app runs without them and the server
  // falls back to Web Speech on the client when unavailable).
  ELEVENLABS_API_KEY_1: z.string().min(1).optional(),
  ELEVENLABS_API_KEY_2: z.string().min(1).optional(),
  ELEVENLABS_API_KEY_3: z.string().min(1).optional(),
  ELEVENLABS_API_KEY_4: z.string().min(1).optional(),
  ELEVENLABS_API_KEY_5: z.string().min(1).optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(),
  ELEVENLABS_MODEL: z.string().optional(),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),
  IGOT_MODE: z.enum(["mock", "live"]).default("mock"),
});

export const env = EnvSchema.parse(process.env);

export type Env = z.infer<typeof EnvSchema>;
