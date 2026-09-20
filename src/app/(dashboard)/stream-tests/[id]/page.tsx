"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { streamTestsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function StreamTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [startingTest, setStartingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTest();
  }, [id]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const res = await streamTestsApi.get(id);
      if (res.success && res.data) {
        setTest(res.data);
      } else {
        setError(res.error?.message || "Failed to load stream test");
      }
    } catch (err) {
      console.error("Failed to load stream test", err);
      setError("Failed to load stream test");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!test) return;
    try {
      setStartingTest(true);
      router.push(`/stream-tests/${id}/take`);
    } catch (err) {
      console.error("Error starting test", err);
      setError("Failed to start test");
      setStartingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="p-12 text-center">
        <BrainCircuit className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Test Not Found</h3>
        <p className="text-sm text-slate-400 mb-4">{error || "The test you requested could not be found."}</p>
        <Button onClick={() => router.push("/stream-tests")} className="bg-purple-700 text-white">
          Back to Stream Tests
        </Button>
      </div>
    );
  }

  const isPassed = test.evidence?.isPassed || false;
  const score = test.percentage || 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="purple" className="capitalize">
              {test.stream?.replace("-", " ") || "General Stream"}
            </Badge>
            <Badge
              variant={test.published ? "emerald" : "amber"}
              size="sm"
              className="capitalize"
            >
              {test.published ? "Published" : "Draft"}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {test.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
            {test.description || "A comprehensive test evaluating core statistical and computational principles relevant to this stream."}
          </p>
        </div>

        <Button
          onClick={() => router.push("/stream-tests")}
          variant="outline"
          className="shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Test Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800/80 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Duration</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{test.durationMinutes || 25} Mins</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800/80 text-center">
          <div className="flex items-center justify-center mb-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Questions</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{test.totalQuestions || 5}</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800/80 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle2
              className={`w-5 h-5 ${
                score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500"
              }`}
            />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Passing Score</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{test.passingScore || 60}%</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800/80 text-center">
          <div className="flex items-center justify-center mb-2">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Difficulty</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
            {test.difficulty || "medium"}
          </p>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card className="p-6 border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Test Questions
          </h3>
          <Badge variant="purple" size="sm">
            {test.questions?.length || 0} questions
          </Badge>
        </div>

        {test.questions && test.questions.length > 0 ? (
          <div className="space-y-4">
            {test.questions.map((question: any, idx: number) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {question.text}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {question.answers?.slice(0, 3).map((answer: any, aIdx: number) => (
                        <span
                          key={aIdx}
                          className={`text-[11px] px-2 py-1 rounded-full ${
                            aIdx === question.selectedAnswerIndex
                              ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {answer.text}
                        </span>
                      ))}
                      {question.answers?.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{question.answers.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-slate-400">
            Questions will be displayed when you start the test
          </div>
        )}
      </Card>

      {/* Preview Knowledge Check */}
      {test.published && (
        <div className="bg-gradient-to-r from-purple-50 dark:from-purple-950/40 to-indigo-50 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-900/60 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <BrainCircuit className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Ready to Test Your Knowledge?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                This stream-based test evaluates your understanding of core statistical and computational principles.
                Review the question preview above, then start the test to answer all questions under timed conditions.
              </p>

              <Button
                onClick={handleStartTest}
                disabled={startingTest}
                className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                {startingTest ? "Starting..." : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Start Test
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!test.published && (
        <div className="p-6 text-center border-2 border-amber-200 dark:border-amber-900/60 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-amber-700 dark:text-amber-400 mb-2">
            Test in Draft Mode
          </h3>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            This test has not been published yet and is not available to learners.
          </p>
        </div>
      )}
    </div>
  );
}
