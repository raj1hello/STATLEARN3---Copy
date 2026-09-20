"use client";

import React, { useState, useEffect } from "react";
import { streamTestsApi, streamsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Sparkles,
  FileCheck2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Send,
} from "lucide-react";
import Link from "next/link";
import { AssignContentModal } from "@/components/trainer/AssignContentModal";

export default function TrainerStreamTestsPage() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTestForAssign, setSelectedTestForAssign] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stream: "statistics",
    difficulty: "medium",
    durationMinutes: 30,
    passingScore: 65,
    published: true,
  });

  const [questions, setQuestions] = useState<
    Array<{
      text: string;
      difficulty: string;
      answers: Array<{ text: string; isCorrect: boolean; explanation: string }>;
    }>
  >([
    {
      text: "",
      difficulty: "medium",
      answers: [
        { text: "", isCorrect: true, explanation: "" },
        { text: "", isCorrect: false, explanation: "" },
        { text: "", isCorrect: false, explanation: "" },
        { text: "", isCorrect: false, explanation: "" },
      ],
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsRes, streamsRes] = await Promise.all([
        streamTestsApi.list({ myOnly: true }),
        streamsApi.list(),
      ]);
      if (testsRes.success && testsRes.data) setTests(testsRes.data);
      if (streamsRes.success && streamsRes.data) setStreams(streamsRes.data);
    } catch (err) {
      console.error("Failed to load trainer stream tests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        difficulty: "medium",
        answers: [
          { text: "", isCorrect: true, explanation: "" },
          { text: "", isCorrect: false, explanation: "" },
          { text: "", isCorrect: false, explanation: "" },
          { text: "", isCorrect: false, explanation: "" },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questions];
    if (updated[idx]) {
      updated[idx].text = text;
      setQuestions(updated);
    }
  };

  const handleAnswerTextChange = (qIdx: number, aIdx: number, text: string) => {
    const updated = [...questions];
    if (updated[qIdx]?.answers?.[aIdx]) {
      updated[qIdx].answers[aIdx].text = text;
      setQuestions(updated);
    }
  };

  const handleCorrectAnswerSelect = (qIdx: number, aIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx]?.answers) {
      updated[qIdx].answers.forEach((ans, i) => {
        ans.isCorrect = i === aIdx;
      });
      setQuestions(updated);
    }
  };

  const handleExplanationChange = (qIdx: number, aIdx: number, explanation: string) => {
    const updated = [...questions];
    if (updated[qIdx]?.answers?.[aIdx]) {
      updated[qIdx].answers[aIdx].explanation = explanation;
      setQuestions(updated);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const currentQ = questions[i];
      if (!currentQ || !currentQ.text.trim()) {
        setError(`Question ${i + 1} text cannot be empty`);
        return;
      }
      const hasCorrect = currentQ.answers.some((a) => a.isCorrect && a.text.trim());
      if (!hasCorrect) {
        setError(`Question ${i + 1} must have a valid correct answer text`);
        return;
      }
    }

    try {
      setSaving(true);
      const res = await streamTestsApi.create({
        ...formData,
        questions,
      });

      if (res.success) {
        setSuccess("Stream-based test created and published successfully!");
        setIsCreating(false);
        await loadData();
      } else {
        setError(res.error?.message || "Failed to create stream test");
      }
    } catch {
      setError("An unexpected error occurred while saving the test");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      const res = await streamTestsApi.delete(id);
      if (res.success) {
        setTests((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete test", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Stream Test Authoring Studio</span>
            <Badge variant="blue" size="sm">
              Trainer Studio
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Author and publish official stream-based assessments and verified question banks
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Cancel Authoring" : "Create New Stream Test"}</span>
        </Button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Creation Modal / Inline Form */}
      {isCreating && (
        <Card className="p-8 border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/20 animate-fadeIn space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <span>New Stream Test Configuration</span>
          </h3>

          <form onSubmit={handleCreateTest} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Test Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Advanced Inferential Statistics & Variance Analysis"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Stream Category
                </label>
                <select
                  value={formData.stream}
                  onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                >
                  {streams.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description / Instructions
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Diagnostic evaluation assessing core theorems and practical computational capabilities..."
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600"
                >
                  <option value="easy">Easy (Foundational)</option>
                  <option value="medium">Medium (Applied)</option>
                  <option value="hard">Hard (Advanced)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* Questions Authoring List */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Questions ({questions.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="text-xs rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Question</span>
                </Button>
              </div>

              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 rounded-2xl bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                      Question {qIdx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder="Enter question text here..."
                    className="w-full bg-slate-50 dark:bg-[#121422] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                    required
                  />

                  {/* Answers */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Options (Select the radio button next to the correct answer)
                    </label>
                    {q.answers.map((ans, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={ans.isCorrect}
                          onChange={() => handleCorrectAnswerSelect(qIdx, aIdx)}
                          className="w-4 h-4 text-purple-600 dark:text-purple-400 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={ans.text}
                          onChange={(e) => handleAnswerTextChange(qIdx, aIdx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + aIdx)}`}
                          className={`flex-1 bg-slate-50 dark:bg-[#121422] border rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none ${
                            ans.isCorrect
                              ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                          required
                        />
                        <input
                          type="text"
                          value={ans.explanation || ""}
                          onChange={(e) => handleExplanationChange(qIdx, aIdx, e.target.value)}
                          placeholder="Explanation / Rationale"
                          className="w-1/3 bg-slate-50 dark:bg-[#121422] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saving}
                className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold px-6 py-2.5"
              >
                Publish Stream Test
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Authored Tests List */}
      <Card className="p-6 border-slate-200 dark:border-slate-800/80">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-700 dark:text-purple-400" />
          <span>Your Authored Stream Tests ({tests.length})</span>
        </h3>

        {tests.length > 0 ? (
          <div className="space-y-3">
            {tests.map((t) => (
              <div
                key={t._id}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.title}</h4>
                    <Badge variant={t.published ? "emerald" : "amber"} size="sm">
                      {t.published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="purple" size="sm" className="capitalize">
                      {t.stream?.replace("-", " ") || "Stream"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Duration: {t.durationMinutes || 25} mins • Benchmark: {t.passingScore || 60}% • Questions: {t.questionCount || 5}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTestForAssign(t);
                      setAssignModalOpen(true);
                    }}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Assign</span>
                  </Button>
                  <Link href={`/stream-tests/${t._id}`}>
                    <Button size="sm" variant="outline" className="text-xs rounded-xl">
                      Preview Test
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteTest(t._id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                    title="Delete test"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No stream tests authored yet. Click &quot;Create New Stream Test&quot; above to create one.
          </div>
        )}
      </Card>

      {/* Assign Stream Test Modal */}
      {selectedTestForAssign && (
        <AssignContentModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          preselectedContent={{
            type: "stream_test",
            refId: selectedTestForAssign._id,
            title: selectedTestForAssign.title,
          }}
        />
      )}
    </div>
  );
}
