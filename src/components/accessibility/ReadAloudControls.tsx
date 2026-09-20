"use client";

/**
 * Read-aloud controls: replay / pause / resume / stop plus an adjustable
 * speech speed selector, backed by the shared speech manager (ElevenLabs TTS
 * with Web Speech fallback). Reused across the mock interview, the AI tutor,
 * and the accessibility toolbar so the whole app drives one voice.
 */
import React from "react";
import { Volume2, Pause, Play, Square } from "lucide-react";
import { useElevenLabsSpeech } from "@/lib/tts/speech";

interface ReadAloudControlsProps {
  text: string;
  compact?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5];

export const ReadAloudControls: React.FC<ReadAloudControlsProps> = ({
  text,
  compact = false,
}) => {
  const { state, status, pause, resume, stop, replay, setRate } = useElevenLabsSpeech();
  const isSpeaking = status === "speaking";
  const isPaused = status === "paused";
  const isLoading = status === "loading";

  const handleReplay = () => {
    replay(text);
  };

  const iconBtn =
    "p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer";

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Read aloud controls">
      {(isSpeaking || isPaused) && (
        <>
          <button
            type="button"
            onClick={() => (isPaused ? resume() : pause())}
            aria-label={isPaused ? "Resume reading" : "Pause reading"}
            title={isPaused ? "Resume" : "Pause"}
            className={iconBtn}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop reading"
            title="Stop"
            className={iconBtn}
          >
            <Square className="w-4 h-4" />
          </button>
        </>
      )}

      <button
        type="button"
        onClick={handleReplay}
        aria-label={isSpeaking ? "Replay reading" : "Read aloud"}
        title={isSpeaking ? "Replay" : "Read aloud"}
        className={`${iconBtn} ${isSpeaking || isLoading ? "text-purple-600 animate-pulse" : ""}`}
      >
        <Volume2 className="w-4 h-4" />
      </button>

      <label className="sr-only" htmlFor="read-aloud-speed">
        Speech speed
      </label>
      <select
        id="read-aloud-speed"
        value={state.rate}
        onChange={(e) => setRate(Number(e.target.value))}
        aria-label="Adjust speech speed"
        title="Speech speed"
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a29] text-slate-700 dark:text-slate-300 text-[10px] font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
      >
        {SPEED_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>

      {!compact && (isSpeaking || isPaused) && (
        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 ml-1">
          {isSpeaking ? "Speaking" : "Paused"}
        </span>
      )}
    </div>
  );
};
