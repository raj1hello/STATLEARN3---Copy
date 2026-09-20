"use client";

import React, { useState, useEffect } from "react";
import {
  assessmentsApi,
  streamTestsApi,
  trainerLearnersApi,
  assignmentsApi,
} from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  X,
  FileCheck2,
  BrainCircuit,
  Layers,
  BookOpen,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
} from "lucide-react";

export interface AssignContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedLearner?: { id: string; name: string };
  preselectedContent?: {
    type: "assessment" | "quiz" | "stream_test" | "material";
    refId: string;
    title: string;
  };
}

export const AssignContentModal: React.FC<AssignContentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedLearner,
  preselectedContent,
}) => {
  const [contentType, setContentType] = useState<
    "assessment" | "quiz" | "stream_test" | "material" | "note"
  >(preselectedContent?.type || "assessment");

  // Selection states
  const [selectedRefId, setSelectedRefId] = useState<string>(preselectedContent?.refId || "");
  const [selectedTitle, setSelectedTitle] = useState<string>(preselectedContent?.title || "");

  // Note fields
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  // Connected learners list & selected IDs
  const [connectedLearners, setConnectedLearners] = useState<any[]>([]);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>(
    preselectedLearner ? [preselectedLearner.id] : []
  );

  // Available catalog items for selection
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(false);

  // Due date & message
  const [dueAt, setDueAt] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync when preselected changes
  useEffect(() => {
    if (preselectedContent) {
      setContentType(preselectedContent.type);
      setSelectedRefId(preselectedContent.refId);
      setSelectedTitle(preselectedContent.title);
    }
  }, [preselectedContent]);

  useEffect(() => {
    if (preselectedLearner) {
      setSelectedLearnerIds([preselectedLearner.id]);
    }
  }, [preselectedLearner]);

  // Load connected learners if modal is open and not preselected
  useEffect(() => {
    if (!isOpen) return;

    async function loadLearners() {
      try {
        setLoadingLearners(true);
        const res = await trainerLearnersApi.list();
        if (res.success && res.data) {
          setConnectedLearners(res.data.learners || []);
          if (!preselectedLearner && res.data.learners?.length === 1) {
            setSelectedLearnerIds([res.data.learners[0].learnerId]);
          }
        }
      } catch (err) {
        console.error("Failed to load learners", err);
      } finally {
        setLoadingLearners(false);
      }
    }

    loadLearners();
  }, [isOpen, preselectedLearner]);

  // Load available items when content type changes and not preselected
  useEffect(() => {
    if (!isOpen || preselectedContent || contentType === "note") return;

    async function loadCatalog() {
      try {
        setLoadingItems(true);
        setAvailableItems([]);
        setSelectedRefId("");
        setSelectedTitle("");

        if (contentType === "assessment" || contentType === "quiz") {
          const res = await assessmentsApi.list({ myOnly: true });
          if (res.success && res.data) {
            const list = (res.data as any[]).filter((a) =>
              contentType === "quiz" ? a.kind === "quiz" : a.kind !== "quiz"
            );
            // If filtered list is empty, include all authored assessments
            setAvailableItems(list.length > 0 ? list : (res.data as any[]));
          }
        } else if (contentType === "stream_test") {
          const res = await streamTestsApi.list({ myOnly: true });
          if (res.success && res.data) {
            setAvailableItems(res.data);
          }
        }
      } catch (err) {
        console.error("Failed to load catalog items", err);
      } finally {
        setLoadingItems(false);
      }
    }

    loadCatalog();
  }, [isOpen, contentType, preselectedContent]);

  if (!isOpen) return null;

  const handleToggleLearner = (id: string) => {
    if (preselectedLearner) return;
    if (selectedLearnerIds.includes(id)) {
      setSelectedLearnerIds(selectedLearnerIds.filter((item) => item !== id));
    } else {
      setSelectedLearnerIds([...selectedLearnerIds, id]);
    }
  };

  const handleSelectAllLearners = () => {
    if (selectedLearnerIds.length === connectedLearners.length) {
      setSelectedLearnerIds([]);
    } else {
      setSelectedLearnerIds(connectedLearners.map((l) => l.learnerId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selectedLearnerIds.length === 0) {
      setError("Please select at least one connected learner.");
      return;
    }

    if (contentType === "note") {
      if (!noteTitle.trim() || !noteBody.trim()) {
        setError("Please provide both a title and content for the note.");
        return;
      }
    } else {
      if (!selectedRefId) {
        setError("Please select the content to assign.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await assignmentsApi.create({
        learnerIds: selectedLearnerIds,
        content: {
          type: contentType,
          refId: contentType !== "note" ? selectedRefId : undefined,
          title: contentType === "note" ? noteTitle.trim() : selectedTitle,
          note:
            contentType === "note"
              ? { title: noteTitle.trim(), body: noteBody.trim() }
              : undefined,
        },
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        message: message.trim() || undefined,
      });

      if (res.success) {
        setSuccess(`Assigned successfully to ${selectedLearnerIds.length} learner(s)!`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(res.error?.message || "Failed to assign content");
      }
    } catch {
      setError("An unexpected error occurred while assigning.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Assign Content to Learner(s)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Send diagnostic assessments, practice quizzes, learning materials, or personalized notes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. CONTENT TYPE SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: "assessment", label: "Assessment", icon: FileCheck2 },
                { type: "quiz", label: "Quiz", icon: BrainCircuit },
                { type: "stream_test", label: "Stream Test", icon: Layers },
                { type: "material", label: "Document", icon: BookOpen },
                { type: "note", label: "Trainer Note", icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = contentType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    disabled={Boolean(preselectedContent)}
                    onClick={() => {
                      setContentType(item.type as any);
                      setSelectedRefId("");
                      setSelectedTitle("");
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-900/20"
                        : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400"
                    } ${preselectedContent ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CONTENT SELECTION OR NOTE EDITOR */}
          {contentType === "note" ? (
            <div className="space-y-3 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Key pointers on Statistical Hypothesis Testing"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note Body / Instructions
                </label>
                <textarea
                  rows={4}
                  placeholder="Write clear statistical concepts, formulas, or review steps for the learner..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
            </div>
          ) : preselectedContent ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Selected Item</p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedTitle}
                </p>
              </div>
              <Badge variant="purple" size="sm">
                Pre-selected
              </Badge>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select {contentType.replace("_", " ")}
              </label>
              {loadingItems ? (
                <div className="p-3 text-xs text-slate-400">Loading catalog items...</div>
              ) : availableItems.length > 0 ? (
                <select
                  value={selectedRefId}
                  onChange={(e) => {
                    setSelectedRefId(e.target.value);
                    const item = availableItems.find((i) => (i._id?.toString() || i._id) === e.target.value);
                    setSelectedTitle(item?.title || item?.fileName || "");
                  }}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                >
                  <option value="">-- Choose item to assign --</option>
                  {availableItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.title || item.fileName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-300">
                  No authored {contentType.replace("_", " ")} items found. Create one first in Trainer Studio!
                </div>
              )}
            </div>
          )}

          {/* 3. TARGET LEARNERS SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Target Learner(s)</span>
                <span className="text-slate-400">({selectedLearnerIds.length} selected)</span>
              </label>

              {!preselectedLearner && connectedLearners.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAllLearners}
                  className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {selectedLearnerIds.length === connectedLearners.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {preselectedLearner ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {preselectedLearner.name}
                  </p>
                  <p className="text-[11px] text-slate-400">Assigned direct from profile</p>
                </div>
                <Badge variant="blue" size="sm">
                  Selected
                </Badge>
              </div>
            ) : loadingLearners ? (
              <div className="p-3 text-xs text-slate-400">Loading connected learners...</div>
            ) : connectedLearners.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                {connectedLearners.map((learner) => {
                  const isChecked = selectedLearnerIds.includes(learner.learnerId);
                  return (
                    <label
                      key={learner.learnerId}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition ${
                        isChecked
                          ? "bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleLearner(learner.learnerId)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {learner.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {learner.stream || learner.email}
                          </p>
                        </div>
                      </div>
                      {learner.activeAssignmentsCount > 0 && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                          {learner.activeAssignmentsCount} active task(s)
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-700 dark:text-amber-300">
                You have no connected learners yet. Accept learner connection requests first!
              </div>
            )}
          </div>

          {/* 4. DUE DATE & OPTIONAL MESSAGE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trainer Message (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Please review before Friday's diagnostic"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                selectedLearnerIds.length === 0 ||
                (contentType !== "note" && !selectedRefId)
              }
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-5"
            >
              {submitting ? "Assigning..." : "Confirm & Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
