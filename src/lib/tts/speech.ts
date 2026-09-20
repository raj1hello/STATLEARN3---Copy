"use client";

/**
 * Client-side speech manager for the app.
 *
 * Uses a single shared HTMLAudioElement so the interview, the AI tutor, and
 * the accessibility toolbar all drive the same voice and stay in sync. Native
 * audio element capabilities give us pause / resume / stop / replay and
 * adjustable speed (playbackRate) for free.
 *
 * Audio is requested from the authenticated server route POST /api/tts, which
 * streams ElevenLabs speech. If the route reports the voice service is
 * unavailable (no keys configured / exhausted), we transparently fall back to
 * the browser's Web Speech Synthesis so narration still works.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechStatus = "idle" | "loading" | "speaking" | "paused";

export interface SpeechState {
  status: SpeechStatus;
  rate: number;
}

export interface SpeechOptions {
  rate?: number;
  voice?: string;
  model?: string;
}

type Listener = (state: SpeechState) => void;

const DEFAULT_RATE = 1.0;

let audio: HTMLAudioElement | null = null;
let currentToken = 0;
let lastUrl: string | null = null;
let currentRate = DEFAULT_RATE;
let state: SpeechState = { status: "idle", rate: currentRate };
const listeners = new Set<Listener>();

function emit() {
  state = { status: state.status, rate: currentRate };
  listeners.forEach((l) => l(state));
}

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio;
  if (typeof window === "undefined") {
    // Should not happen in client code, but guard for safety.
    return null as unknown as HTMLAudioElement;
  }
  audio = new Audio();
  audio.preload = "auto";

  audio.addEventListener("playing", () => {
    state.status = "speaking";
    state.rate = currentRate;
    emit();
  });
  audio.addEventListener("pause", () => {
    if (state.status === "speaking") {
      state.status = "paused";
      emit();
    }
  });
  audio.addEventListener("play", () => {
    state.status = "speaking";
    emit();
  });
  audio.addEventListener("ended", () => {
    cleanupUrl();
    state.status = "idle";
    emit();
  });
  audio.addEventListener("error", () => {
    cleanupUrl();
    state.status = "idle";
    emit();
  });

  return audio;
}

function cleanupUrl() {
  if (lastUrl) {
    try {
      URL.revokeObjectURL(lastUrl);
    } catch {
      /* noop */
    }
    lastUrl = null;
  }
  if (audio) {
    audio.removeAttribute("src");
    audio.load();
  }
}

function setStatus(status: SpeechStatus) {
  state.status = status;
  emit();
}

/** Speak a piece of text using the shared audio element (ElevenLabs via /api/tts). */
async function speak(text: string, opts: SpeechOptions = {}): Promise<void> {
  if (!text || !text.trim()) return;
  const token = ++currentToken;
  const target = ensureAudio();
  const rate = opts.rate ?? currentRate;

  // Stop whatever is currently playing and drop the old source.
  try {
    target.pause();
  } catch {
    /* noop */
  }
  cleanupUrl();
  setStatus("loading");

  // Web Speech Synthesis fallback path.
  const canFallback = typeof window !== "undefined" && "speechSynthesis" in window;
  let result: Response;
  try {
    result = await fetch("/api/tts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, rate, voice: opts.voice, model: opts.model }),
    });
  } catch (err) {
    // Network failure — fall back to Web Speech if possible.
    if (token === currentToken) {
      if (canFallback) {
        speakWithWebSpeech(text, rate);
        return;
      }
      setStatus("idle");
    }
    return;
  }

  // If a newer speak() superseded us, do nothing.
  if (token !== currentToken) return;

  if (!result.ok) {
    // Voice service unavailable (503/429) or auth problem — fall back.
    if (canFallback) {
      speakWithWebSpeech(text, rate);
      return;
    }
    setStatus("idle");
    return;
  }

  try {
    const blob = await result.blob();
    if (token !== currentToken) {
      // Superseded while downloading.
      return;
    }
    const url = URL.createObjectURL(blob);
    lastUrl = url;
    target.src = url;
    target.playbackRate = rate;
    currentRate = rate;
    // iOS Safari may reject play() without a prior user gesture; swallow it.
    await target.play().catch(() => {
      /* auto-play may be blocked; user can trigger via a control */
    });
  } catch (err) {
    if (token === currentToken) {
      cleanupUrl();
      setStatus("idle");
      if (canFallback) speakWithWebSpeech(text, rate);
    }
  }
}

/** Web Speech Synthesis fallback (robotic voice). */
function speakWithWebSpeech(text: string, rate: number) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    setStatus("idle");
    return;
  }
  const el = ensureAudio();
  try {
    el.pause();
  } catch {
    /* noop */
  }
  cleanupUrl();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.onstart = () => setStatus("speaking");
  utterance.onend = () => {
    cleanupUrl();
    setStatus("idle");
  };
  utterance.onerror = () => setStatus("idle");
  window.speechSynthesis.speak(utterance);
}

function pause() {
  if (audio) audio.pause();
}

function resume() {
  if (!audio) return;
  currentToken += 1;
  if (audio.src) {
    audio.playbackRate = currentRate;
    audio.play().catch(() => {});
  }
}

function stop() {
  currentToken += 1;
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* noop */
    }
    cleanupUrl();
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  setStatus("idle");
}

function replay(text: string, opts: SpeechOptions = {}) {
  return speak(text, { ...opts, rate: opts.rate ?? currentRate });
}

function setRate(rate: number) {
  currentRate = rate;
  if (audio) {
    audio.playbackRate = rate;
  }
  emit();
}

function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => {
    listeners.delete(fn);
  };
}

function getState(): SpeechState {
  return { ...state };
}

/**
 * Strips common Markdown syntax so AI responses read aloud as clean prose
 * (headings, bold/italic, inline code, links, bullet markers, strikeout,
 * blockquotes and HTML tags). Simple and lossy — good enough for narration.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const speechManager = {
  speak,
  pause,
  resume,
  stop,
  replay,
  setRate,
  subscribe,
  getState,
};

/**
 * React hook wrapping the shared speech manager. Returns controls and the
 * current speaking state so components can render indicators and buttons.
 */
export function useElevenLabsSpeech() {
  const [speech, setSpeech] = useState<SpeechState>(() => speechManager.getState());
  const stateRef = useRef(speech);
  stateRef.current = speech;

  useEffect(() => {
    return speechManager.subscribe((s) => {
      setSpeech({ ...s });
    });
  }, []);

  const isActive =
    stateRef.current.status === "speaking" || stateRef.current.status === "loading";

  const handleSpeak = useCallback((text: string, opts?: SpeechOptions) => {
    return speechManager.speak(text, opts);
  }, []);
  const handlePause = useCallback(() => speechManager.pause(), []);
  const handleResume = useCallback(() => speechManager.resume(), []);
  const handleStop = useCallback(() => speechManager.stop(), []);
  const handleReplay = useCallback((text: string, opts?: SpeechOptions) => {
    return speechManager.replay(text, opts);
  }, []);
  const handleSetRate = useCallback((rate: number) => speechManager.setRate(rate), []);

  return {
    state: speech,
    status: speech.status,
    rate: speech.rate,
    isActive,
    speak: handleSpeak,
    pause: handlePause,
    resume: handleResume,
    stop: handleStop,
    replay: handleReplay,
    setRate: handleSetRate,
  };
}
