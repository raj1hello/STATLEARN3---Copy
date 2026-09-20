"use client";

/**
 * Floating, keyboard-accessible accessibility toolbar mounted globally in the
 * root layout. Provides:
 *  - Auto-narration toggle (reads AI responses aloud when enabled)
 *  - Adjustable speech speed
 *  - Voice input (dictation into the currently focused text field)
 *  - A read-aloud / replay control set for the page's primary content
 *
 * The collapsed (<dialog>-style disclosure) keeps it from clashing with the
 * existing design; the trigger is the first tab stop for screen-reader users.
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useA11y } from "@/components/accessibility/A11yProvider";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { ReadAloudControls } from "@/components/accessibility/ReadAloudControls";
import { stripMarkdown } from "@/lib/tts/speech";
import { Accessibility, Mic, MicOff } from "lucide-react";

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5];

export const A11yToolbar: React.FC = () => {
  const { settings, setNarration, setRate } = useA11y();
  const [open, setOpen] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<HTMLElement | null>(null);
  const dictationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Text to read aloud for the "read this page" control: the rendered text of
  // the dashboard main region, stripped of markdown and truncated to the TTS
  // route's per-request cap (4000 chars) so narration heads the page cleanly.
  const [pageText, setPageText] = useState("");
  const refreshPageText = useCallback(() => {
    const el = document.querySelector<HTMLElement>("main#main-content");
    if (el?.innerText) {
      setPageText(stripMarkdown(el.innerText).slice(0, 3990));
    }
  }, []);

  useEffect(() => {
    refreshPageText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the focused editable element so dictation knows where to type.
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "TEXTAREA" ||
          el.tagName === "INPUT" ||
          el.getAttribute("contenteditable") === "true")
      ) {
        setDictationTarget(el);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  const {
    isRecording,
    transcript,
    error: dictationError,
    supported: sttSupported,
    start: startDictation,
    stop: stopDictation,
    toggle: toggleDictation,
  } = useSpeechToText({ continuous: false, interimResults: true });

  // When dictation stops, type the final transcript into the focused field.
  useEffect(() => {
    if (!isRecording && transcript.trim()) {
      const el = dictationTarget as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(
          el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement
            ? window.HTMLInputElement.prototype
            : (el as HTMLElement).constructor.prototype,
          "value"
        )?.set;
        if (setter) setter.call(el, transcript);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        try {
          el.focus();
        } catch {
          /* noop */
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  // Auto-stop dictation after a few seconds of silence.
  useEffect(() => {
    if (!isRecording) {
      if (dictationTimerRef.current) {
        clearInterval(dictationTimerRef.current);
        dictationTimerRef.current = null;
      }
      return;
    }
    dictationTimerRef.current = setInterval(() => {
      stopDictation();
    }, 6000);
    return () => {
      if (dictationTimerRef.current) {
        clearInterval(dictationTimerRef.current);
        dictationTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const handleToggleNarration = () => {
    setNarration(!settings.narrationEnabled);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRate(Number(e.target.value));
  };

  const handleToggleOpen = () => {
    if (!open) refreshPageText();
    setOpen((o) => !o);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {/* Expanded panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Accessibility controls"
          className="w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a29] shadow-lg p-4 space-y-4 animate-fadeIn"
        >
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Accessibility
          </p>

          {/* Auto-narration toggle */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Auto-read AI responses
            </span>
            <button
              type="button"
              onClick={handleToggleNarration}
              aria-pressed={settings.narrationEnabled}
              aria-label="Toggle automatic reading of AI responses"
              className={`px-2.5 py-1 rounded-xl font-semibold border transition-colors cursor-pointer ${
                settings.narrationEnabled
                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                  : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {settings.narrationEnabled ? "On" : "Off"}
            </button>
          </div>

          {/* Speech speed */}
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="a11y-speed"
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300"
            >
              Speech speed
            </label>
            <select
              id="a11y-speed"
              value={settings.speechRate}
              onChange={handleRateChange}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a29] text-slate-700 dark:text-slate-300 text-[10px] font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              {SPEED_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>

          {/* Voice input (dictation) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Voice input
              </span>
              <button
                type="button"
                onClick={toggleDictation}
                disabled={!sttSupported}
                aria-pressed={isRecording}
                aria-label={isRecording ? "Stop voice dictation" : "Start voice dictation"}
                className={`px-2.5 py-1 rounded-xl font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                  isRecording
                    ? "bg-red-600 text-white border-red-500 animate-pulse"
                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5 inline -mt-0.5" /> : <Mic className="w-3.5 h-3.5 inline -mt-0.5" />}
                {isRecording ? " Listening" : " Dictate"}
              </button>
            </div>
            {dictationError && (
              <p className="text-[10px] text-amber-700 dark:text-amber-300">{dictationError}</p>
            )}
            {isRecording && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Speaking... your words will be typed into the focused field.
              </p>
            )}
          </div>

          {/* Read-aloud controls for the page's primary content */}
          <ReadAloudControls text={pageText} compact />
        </div>
      )}

      {/* Floating trigger */}
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-expanded={open}
        aria-label={open ? "Close accessibility controls" : "Open accessibility controls"}
        title="Accessibility controls"
        className="w-12 h-12 rounded-2xl bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 text-white flex items-center justify-center shadow-lg cursor-pointer"
      >
        <Accessibility className="w-6 h-6" />
      </button>
    </div>
  );
};
