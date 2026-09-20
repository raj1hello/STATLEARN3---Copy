"use client";

/**
 * Accessibility settings provider.
 *
 * Mirrors the ThemeProvider pattern: stores accessibility preferences in
 * localStorage (`statlearn_a11y`) so they persist across reloads, and exposes
 * narration controls backed by the shared speech manager. Auto-narration reads
 * AI responses aloud using ElevenLabs TTS (with Web Speech fallback).
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { speechManager } from "@/lib/tts/speech";

export interface A11ySettings {
  narrationEnabled: boolean;
  speechRate: number;
}

interface A11yContextType {
  settings: A11ySettings;
  setNarration: (enabled: boolean) => void;
  setRate: (rate: number) => void;
  speak: (text: string) => void;
  stop: () => void;
  mounted: boolean;
}

const STORAGE_KEY = "statlearn_a11y";

const DEFAULT_SETTINGS: A11ySettings = {
  narrationEnabled: false,
  speechRate: 1.0,
};

const A11yContext = createContext<A11yContextType>({
  settings: DEFAULT_SETTINGS,
  setNarration: () => {},
  setRate: () => {},
  speak: () => {},
  stop: () => {},
  mounted: false,
});

export const A11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let initial: A11ySettings = { ...DEFAULT_SETTINGS };
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<A11ySettings>;
        if (typeof parsed.narrationEnabled === "boolean") {
          initial.narrationEnabled = parsed.narrationEnabled;
        }
        if (typeof parsed.speechRate === "number" && parsed.speechRate >= 0.5 && parsed.speechRate <= 1.5) {
          initial.speechRate = parsed.speechRate;
        }
      }
    } catch {
      // localStorage not available
    }
    setSettings(initial);
    // Keep the shared speech manager's rate in sync with the stored value.
    speechManager.setRate(initial.speechRate);
    setMounted(true);
  }, []);

  const persist = useCallback((next: A11ySettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setNarration = useCallback(
    (enabled: boolean) => {
      persist({ ...settings, narrationEnabled: enabled });
    },
    [settings, persist]
  );

  const setRate = useCallback(
    (rate: number) => {
      speechManager.setRate(rate);
      persist({ ...settings, speechRate: rate });
    },
    [settings, persist]
  );

  const speak = useCallback(
    (text: string) => {
      speechManager.speak(text, { rate: settings.speechRate });
    },
    [settings.speechRate]
  );

  const stop = useCallback(() => {
    speechManager.stop();
  }, []);

  const value = useMemo(
    () => ({ settings, setNarration, setRate, speak, stop, mounted }),
    [settings, setNarration, setRate, speak, stop, mounted]
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
};

export const useA11y = () => useContext(A11yContext);
