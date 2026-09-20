"use client";

import React, { useEffect, useState } from "react";
import { materialsApi, assignmentsApi } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";

interface MaterialViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  assignmentId?: string;
  assignmentStatus?: string;
  onStatusChange?: (newStatus: "completed") => void;
}

export const MaterialViewerModal: React.FC<MaterialViewerModalProps> = ({
  isOpen,
  onClose,
  materialId,
  assignmentId,
  assignmentStatus,
  onStatusChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [markingDone, setMarkingDone] = useState(false);
  const [isCompleted, setIsCompleted] = useState(assignmentStatus === "completed");

  useEffect(() => {
    if (!isOpen || !materialId) return;

    setIsCompleted(assignmentStatus === "completed");
    async function loadMaterial() {
      try {
        setLoading(true);
        setError(null);
        const res = await materialsApi.get(materialId);
        if (res.success && res.data) {
          setMaterial(res.data);
        } else {
          setError(res.error?.message || "Failed to load learning material");
        }
      } catch {
        setError("An unexpected error occurred while loading material");
      } finally {
        setLoading(false);
      }
    }

    loadMaterial();
  }, [isOpen, materialId, assignmentStatus]);

  if (!isOpen) return null;

  const handleMarkDone = async () => {
    if (!assignmentId) return;
    try {
      setMarkingDone(true);
      const res = await assignmentsApi.updateStatus(assignmentId, "completed");
      if (res.success) {
        setIsCompleted(true);
        if (onStatusChange) onStatusChange("completed");
      } else {
        setError(res.error?.message || "Failed to update status");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setMarkingDone(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {material?.fileName || "Learning Document"}
                </h2>
                <Badge variant="blue" size="sm">
                  Read-Only Mode
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Uploaded trainer material for your statistical study
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

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : material ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {material.extractedText || "No text content found in this document."}
              </div>

              {material.chunks && (
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Structured Semantic Chunks
                  </p>
                  <pre className="text-[11px] text-slate-600 dark:text-slate-400 overflow-x-auto">
                    {JSON.stringify(material.chunks, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : null}
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
              <span>Review document thoroughly before marking complete</span>
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
            {assignmentId && !isCompleted && (
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
