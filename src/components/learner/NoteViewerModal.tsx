"use client";

import React, { useState } from "react";
import { assignmentsApi } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface NoteViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onStatusChange?: (newStatus: "completed") => void;
}

export const NoteViewerModal: React.FC<NoteViewerModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onStatusChange,
}) => {
  const [markingDone, setMarkingDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(assignment?.status === "completed");

  if (!isOpen || !assignment) return null;

  const note = assignment.content?.note || {
    title: assignment.content?.title || "Trainer Note",
    body: "",
  };

  const handleMarkDone = async () => {
    try {
      setMarkingDone(true);
      setError(null);
      const res = await assignmentsApi.updateStatus(assignment._id, "completed");
      if (res.success) {
        setIsCompleted(true);
        if (onStatusChange) onStatusChange("completed");
      } else {
        setError(res.error?.message || "Failed to mark as done");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setMarkingDone(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {note.title}
                </h2>
                <Badge variant="purple" size="sm">
                  Trainer Note
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                From {assignment.trainerName || "Your Trainer"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {assignment.message && (
            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <span className="font-semibold">Trainer Message: </span>
                <span>{assignment.message}</span>
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {note.body || "No note content provided."}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div className="text-xs text-slate-400">
            {isCompleted ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </span>
            ) : (
              <span>Read through before marking as done</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            {!isCompleted && (
              <Button
                type="button"
                onClick={handleMarkDone}
                disabled={markingDone}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{markingDone ? "Marking..." : "Mark as Done"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
