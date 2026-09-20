"use client";

import React, { useState } from "react";
import { FileEdit, BrainCircuit, BookMarked, Loader2 } from "lucide-react";

export interface ContextActionsProps {
  onAction: (actionType: "assessment" | "quiz" | "notes") => Promise<void>;
  disabled?: boolean;
  isGenerating?: "assessment" | "quiz" | "notes" | null;
}

export function ContextActionButtons({
  onAction,
  disabled = false,
  isGenerating = null,
}: ContextActionsProps) {
  const actions = [
    {
      id: "assessment" as const,
      label: "Create Assessment",
      icon: FileEdit,
      ariaLabel: "Create Assessment from current conversation",
    },
    {
      id: "quiz" as const,
      label: "Generate Quiz",
      icon: BrainCircuit,
      ariaLabel: "Generate Quiz from current conversation",
    },
    {
      id: "notes" as const,
      label: "Make Notes",
      icon: BookMarked,
      ariaLabel: "Make Notes from current conversation",
    },
  ];

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {actions.map((act) => {
        const Icon = act.icon;
        const busy = isGenerating === act.id;

        return (
          <div key={act.id} className="relative group">
            <button
              type="button"
              aria-label={act.ariaLabel}
              title={act.label}
              disabled={disabled || Boolean(isGenerating)}
              onClick={() => onAction(act.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#181a29] text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-800/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Custom Tooltip */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-medium rounded-md whitespace-nowrap shadow-md pointer-events-none z-50 border border-slate-700/60 animate-in fade-in zoom-in-95 duration-100">
              {act.label}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-b border-slate-700/60" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
