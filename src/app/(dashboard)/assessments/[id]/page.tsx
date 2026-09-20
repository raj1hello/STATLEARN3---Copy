"tsx"
"use client";

import React, { useEffect, useState, use } from "react";
import { assessmentsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AssessmentAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startedAt] = useState<string>(new Date().toISOString());

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await assessmentsApi.get(id);
        if (res.success && res.data) {
          setAssessment(res.data);
          setQuestions((res.data as any).questions || []);
        }
      } catch (err) {
        console.error("Failed to load assessment", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    const updated = new Map(answers);
    updated.set(questionId, optionIndex);
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const answerPayload = Array.from(answers.entries()).map(([qId, optIdx]) => ({
        questionId: qId,
        selectedAnswerIndex: optIdx,
      }));

      const res = await assessmentsApi.submit(id, {
        startedAt,
        answers: answerPayload,
      });

      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err) {
      console.error("Failed to submit assessment", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // 1. RESULT & EVIDENCE VIEW (After submission)
  if (result) {
    const score = result.score;
    const isPassed = score >= 70;
    const evidenceItems = result.evidence?.items || [];

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        {/* Top Summary Banner */}
        <Card className="p-8 text-center bg-gradient-to-b from-white dark:from-[#181a29] to-purple-50/40 dark:to-purple-950/20 border-purple-100 dark:border-purple-900/40 shadow-lg">
          <div
            className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 ${
              isPassed
                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                : "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400"
            }`}
          >
            {isPassed ? <CheckCircle2 className="w-8 h-8" /> : <FileCheck2 className="w-8 h-8" />}
          </div>

          <Badge variant={isPassed ? "emerald" : "purple"} size="md" className="mb-2">
            Assessment Completed
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{assessment?.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Official Server-Calculated Evaluation Result</p>

          <div className="mt-6 flex justify-center items-baseline gap-2">
            <span className="text-5xl font-black text-slate-900 dark:text-slate-100">{score}%</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              ({result.correctCount} / {result.totalQuestions} Correct)
            </span>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/dashboard">
              <Button className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold px-6 py-2.5">
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/gap-analysis">
              <Button variant="outline" className="rounded-xl text-xs font-semibold px-6 py-2.5">
                View Updated Skill Gaps
              </Button>
            </Link>
          </div>
        </Card>

        {/* Question by Question Evidence Review */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Diagnostic Evidence & Explanations</h3>
          </div>

          {evidenceItems.map((item: any, idx: number) => (
            <Card
              key={idx}
              className={`p-6 border ${
                item.isCorrect
                  ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/10 dark:bg-emerald-950/20"
                  : "border-red-200 dark:border-red-900/60 bg-red-50/10 dark:bg-red-950/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.isCorrect
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {item.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Question {idx + 1}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{item.questionText}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 p-3 bg-white dark:bg-[#181a29] rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Explanation: </span>
                      {item.explanation}
                    </p>
                  </div>
                </div>

                <Badge variant={item.isCorrect ? "emerald" : "red"} size="sm">
                  {item.isCorrect ? "Correct" : "Incorrect"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 2. ACTIVE TEST TAKING INTERFACE
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = answers.size;
  const selectedOptionIndex = currentQuestion ? answers.get(currentQuestion._id) : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Test Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#11131f] p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple" size="sm">
              {assessment?.type?.toUpperCase()}
            </Badge>
            <span className="text-xs text-slate-400 dark:text-slate-500">Time Limit: 30 Mins</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{assessment?.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            loading={submitting}
            className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold px-4 py-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Assessment</span>
          </Button>
        </div>
      </div>

      {/* Question Stepper Indicator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {questions.map((q, idx) => {
          const isAnswered = answers.has(q._id);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q._id || idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? "bg-purple-700 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-300 dark:ring-purple-700"
                  : isAnswered
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60"
                  : "bg-white dark:bg-[#181a29] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQuestion ? (
        <Card className="p-8 shadow-card border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <Badge variant="slate" size="sm">
              Difficulty: {currentQuestion.difficulty}
            </Badge>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed mb-6">
            {currentQuestion.text}
          </h3>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.answers?.map((option: any, optIdx: number) => {
              const isSelected = selectedOptionIndex === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion._id, optIdx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "border-purple-600 dark:border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-1 ring-purple-600 dark:ring-purple-500 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a29] hover:border-purple-200 dark:hover:border-purple-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{option.text}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="text-xs font-semibold rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {answeredCount} of {totalQuestions} Answered
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-xs font-semibold rounded-xl"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl"
              >
                <span>Complete</span>
                <Send className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
