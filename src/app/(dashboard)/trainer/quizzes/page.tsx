"tsx"
"use client";

import React, { useState, useEffect } from "react";
import { quizzesApi, competenciesApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Sparkles,
  FileCheck2,
  CheckCircle2,
  Trash2,
  Edit2,
  Send,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AssignContentModal } from "@/components/trainer/AssignContentModal";

export default function TrainerQuizzesPage() {
  const searchParams = useSearchParams();
  const preloadedMaterialId = searchParams.get("materialId") || undefined;
  const preloadedQuizId = searchParams.get("id") || undefined;

  const [competencies, setCompetencies] = useState<any[]>([]);
  const [title, setTitle] = useState("AI Diagnostic: Statistical Sampling");
  const [competencyName, setCompetencyName] = useState("Statistical Analysis");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [type, setType] = useState<"mcq" | "scenario">("mcq");

  const [generating, setGenerating] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  useEffect(() => {
    async function loadComps() {
      const res = await competenciesApi.list();
      if (res.success && res.data) setCompetencies(res.data as any[]);
    }
    loadComps();

    if (preloadedQuizId) {
      loadQuiz(preloadedQuizId);
    }
  }, [preloadedQuizId]);

  const loadQuiz = async (id: string) => {
    try {
      const res = await quizzesApi.get(id);
      if (res.success && res.data) {
        setQuizData(res.data);
        setQuestions((res.data as any).questions || []);
      }
    } catch (err) {
      console.error("Failed to load quiz", err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPublishSuccess(false);
    try {
      setGenerating(true);
      const res = await quizzesApi.generate({
        title,
        competencyName,
        materialId: preloadedMaterialId,
        count: Number(count),
        difficulty,
        type,
      });

      if (res.success && res.data) {
        setQuizData(res.data);
        setQuestions((res.data as any).questions || []);
      } else {
        setError(res.error?.message || "Quiz generation failed");
      }
    } catch {
      setError("An unexpected error occurred during generation");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    const assessmentId = quizData?.assessment?._id || preloadedQuizId;
    if (!assessmentId) return;

    try {
      const res = await quizzesApi.patch(assessmentId, { action: "publish" });
      if (res.success) {
        setPublishSuccess(true);
        if (quizData?.assessment) {
          setQuizData({
            ...quizData,
            assessment: { ...quizData.assessment, published: true },
          });
        }
      }
    } catch (err) {
      console.error("Failed to publish", err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    const assessmentId = quizData?.assessment?._id || preloadedQuizId;
    if (!assessmentId) return;

    try {
      const res = await quizzesApi.patch(assessmentId, {
        action: "delete_question",
        questionId: qId,
      });
      if (res.success) {
        setQuestions(questions.filter((q) => q._id !== qId));
      }
    } catch (err) {
      console.error("Failed to delete question", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">AI Quiz Generator & Review</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate draft question banks with strict Human-In-The-Loop trainer verification
          </p>
        </div>

        {quizData && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setAssignModalOpen(true)}
              variant="outline"
              className="rounded-xl text-xs font-semibold px-4 py-2 flex items-center gap-2 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Assign to Learner(s)</span>
            </Button>
            <Button
              onClick={handlePublish}
              disabled={quizData?.assessment?.published}
              className={`rounded-xl text-xs font-semibold px-5 py-2 flex items-center gap-2 ${
                quizData?.assessment?.published
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-purple-700 hover:bg-purple-800 text-white shadow-md shadow-purple-700/25"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{quizData?.assessment?.published ? "Published to Learners" : "Publish Assessment"}</span>
            </Button>
          </div>
        )}
      </div>

      {publishSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Assessment published successfully! Learners can now take this evaluation in their dashboard.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Configuration Form */}
      <Card className="p-6 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-700 dark:text-purple-300" />
          <span>Assessment Generation Parameters</span>
        </h3>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Assessment Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Competency</label>
              <input
                type="text"
                value={competencyName}
                onChange={(e) => setCompetencyName(e.target.value)}
                placeholder="e.g. Statistical Analysis"
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Question Count</label>
              <input
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
              >
                <option className="bg-white dark:bg-slate-800" value="easy">Easy (Foundational)</option>
                <option className="bg-white dark:bg-slate-800" value="medium">Medium (Applied)</option>
                <option className="bg-white dark:bg-slate-800" value="hard">Hard (Advanced Scenarios)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Question Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
              >
                <option className="bg-white dark:bg-slate-800" value="mcq">Multiple Choice (MCQ)</option>
                <option className="bg-white dark:bg-slate-800" value="scenario">Scenario-Based</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              loading={generating}
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-6 py-2.5 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Assessment Draft</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Draft Review & Verification UI */}
      {questions.length > 0 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-purple-700 dark:text-purple-300" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Generated Draft Questions ({questions.length})
              </h3>
            </div>
            <Badge variant="amber" size="sm">
              Review Flow: Trainer Verification Required
            </Badge>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={q._id || idx} className="p-6 border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Question {idx + 1}</span>
                      <Badge variant="slate" size="sm">
                        {q.difficulty}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        AI Generated
                      </Badge>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{q.text}</h4>

                    {/* Answers Breakdown */}
                    <div className="space-y-2 pt-2">
                      {q.answers?.map((ans: any, aIdx: number) => (
                        <div
                          key={aIdx}
                          className={`p-3 rounded-xl border text-xs flex items-start justify-between ${
                            ans.isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-300 font-semibold"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{String.fromCharCode(65 + aIdx)}.</span>
                            <span>{ans.text}</span>
                          </div>
                          {ans.isCorrect && (
                            <Badge variant="emerald" size="sm">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q._id)}
                    className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assign to Connected Learners Modal */}
      {quizData && (
        <AssignContentModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          preselectedContent={{
            type: "quiz",
            refId: quizData?.assessment?._id || preloadedQuizId || "",
            title: quizData?.assessment?.title || title,
          }}
        />
      )}
    </div>
  );
}
