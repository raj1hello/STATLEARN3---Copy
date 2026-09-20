"use client";

/**
 * Reusable Web Speech Recognition (Speech-to-Text) hook.
 *
 * Extracted from the mock interview's inline implementation so the
 * accessibility toolbar's voice-input (dictation) and the interview share the
 * same underlying logic. Uses the browser-native SpeechRecognition API.
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechToTextOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechToTextResult {
  isRecording: boolean;
  transcript: string;
  error: string | null;
  supported: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  reset: () => void;
}

type SpeechRecognitionCtor = new () => any;

export function useSpeechToText(
  options: UseSpeechToTextOptions = {}
): UseSpeechToTextResult {
  const { lang = "en-US", continuous = true, interimResults = true } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const supported =
    typeof window !== "undefined" &&
    Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  const start = useCallback(() => {
    setError(null);

    if (typeof window === "undefined") return;

    const Ctor: SpeechRecognitionCtor | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!Ctor) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new Ctor();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i += 1) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setError("Microphone permission was denied. Please allow microphone access.");
        } else if (event.error === "no-speech") {
          // Leave open.
        } else {
          setError(`Voice input notice: ${event.error}.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to access microphone.");
      setIsRecording(false);
    }
  }, [continuous, interimResults, lang]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
      setIsRecording(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      stop();
    } else {
      start();
    }
  }, [isRecording, start, stop]);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { isRecording, transcript, error, supported, start, stop, toggle, reset };
}
