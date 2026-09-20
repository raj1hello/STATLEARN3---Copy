"use client";

import React, { useEffect, useState } from "react";
import { mockInterviewApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { VoiceInterviewInterface } from "@/components/mock-interview/VoiceInterviewInterface";
import { ReadAloudControls } from "@/components/accessibility/ReadAloudControls";
import { useA11y } from "@/components/accessibility/A11yProvider";
import { stripMarkdown } from "@/lib/tts/speech";
import {
  Bot,
  Mic,
  Sparkles,
  Award,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Briefcase,
  Layers,
  History,
  Trash2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const TARGET_ROLES = [
  { title: "Statistical Analyst", stream: "Statistics & Probability" },
  { title: "Data Scientist", stream: "Data Analytics & ML" },
  { title: "Python & Data Engineer", stream: "Programming & Systems" },
  { title: "Machine Learning Engineer", stream: "Machine Learning & AI" },
  { title: "Official Survey & Methodology Officer", stream: "Economics & Governance" },
  { title: "Quantitative Researcher", stream: "Advanced Analytics" },
];

export default function MockInterviewHubPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  // Setup form state
  const [targetRole, setTargetRole] = useState("Statistical Analyst");
  const [customRole, setCustomRole] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [jobDescription, setJobDescription] = useState("");
  const [maxQuestions, setMaxQuestions] = useState(5);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Interview state
  const [activeInterview, setActiveInterview] = useState<any | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [finalReport, setFinalReport] = useState<any | null>(null);

  // Global a11y settings: narrate the final report when auto-narration is on.
  const { settings, speak } = useA11y();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await mockInterviewApi.list();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to load mock interview history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const roleToUse = targetRole === "custom" ? customRole.trim() : targetRole;
    if (!roleToUse) {
      setError("Please specify a target role for the mock interview");
      return;
    }

    try {
      setStarting(true);
      const res = await mockInterviewApi.start({
        targetRole: roleToUse,
        difficulty,
        jobDescription: jobDescription.trim() || undefined,
        maxQuestions,
      });

      if (res.success && res.data) {
        setActiveInterview(res.data.interview);
        setFinalReport(null);
      } else {
        setError(res.error?.message || "Failed to start mock interview");
      }
    } catch (err) {
      setError("AI interview service is temporarily unavailable. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async (userAnswer: string, questionIndex: number): Promise<boolean> => {
    if (!activeInterview?._id) return false;
    try {
      setSubmittingAnswer(true);
      const res = await mockInterviewApi.submitAnswer(activeInterview._id, {
        userAnswer,
        questionIndex,
      });

      if (res.success && res.data) {
        if (res.data.isLastQuestion || !res.data.nextQuestion) {
          // Finish interview automatically
          await handleFinishInterview();
        } else {
          setActiveInterview(res.data.interview);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to submit answer", err);
      return false;
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!activeInterview?._id) return;
    try {
      setSubmittingAnswer(true);
      const res = await mockInterviewApi.finish(activeInterview._id);
      if (res.success && res.data) {
        const report = res.data.report;
        setFinalReport(report);
        setActiveInterview(null);
        await loadHistory();

        // Narrate the overall result when the global auto-narration is on.
        if (settings.narrationEnabled && typeof report?.overallScore === "number") {
          speak(
            stripMarkdown(
              `Your interview score is ${report.overallScore} percent. ${report.summary ?? ""}`
            )
          );
        }
      }
    } catch (err) {
      console.error("Failed to finalize interview", err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!window.confirm("Delete this interview record?")) return;
    try {
      const res = await mockInterviewApi.delete(id);
      if (res.success) {
        setHistory((prev) => prev.filter((h) => h._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete interview", err);
    }
  };

  // ============================================================
  // 1. ACTIVE LIVE VOICE INTERVIEW VIEW
  // ============================================================
  if (activeInterview) {
    const currentQ =
      activeInterview.questions[activeInterview.currentQuestionIndex] ||
      activeInterview.questions[activeInterview.questions.length - 1];

    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <VoiceInterviewInterface
          interviewId={activeInterview._id}
          targetRole={activeInterview.targetRole}
          difficulty={activeInterview.difficulty}
          maxQuestions={activeInterview.maxQuestions}
          currentQuestion={currentQ}
          questions={activeInterview.questions}
          onSubmitAnswer={handleSubmitAnswer}
          onFinishInterview={handleFinishInterview}
          submitting={submittingAnswer}
        />
      </div>
    );
  }

  // ============================================================
  // 2. FINAL COMPREHENSIVE INTERVIEW REPORT VIEW
  // ============================================================
  if (finalReport) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Top Report Header Card */}
        <Card className="p-8 text-center bg-gradient-to-b from-white dark:from-[#181a29] to-purple-50/40 dark:to-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-lg">
          <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400">
            <Award className="w-8 h-8" />
          </div>

          <Badge variant="purple" size="md" className="mb-2">
            AI Interview Evaluation Complete
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Interview Performance Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Claude-Generated Competency & Behavioral Diagnostic
          </p>

          <div className="mt-6 flex justify-center items-baseline gap-2">
            <span className="text-5xl font-black text-slate-900 dark:text-slate-100">
              {finalReport.overallScore}%
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Overall Interview Score
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto mt-4 leading-relaxed p-3 bg-white/70 dark:bg-[#121422] rounded-xl border border-slate-100 dark:border-slate-800">
            {finalReport.summary}
          </p>

          {/* Replay / pause / resume / stop + speed for the report summary */}
          <div className="mt-4 flex justify-center">
            <ReadAloudControls
              text={`Your interview score is ${finalReport.overallScore} percent. ${finalReport.summary ?? ""}`}
            />
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Button
              onClick={() => setFinalReport(null)}
              className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 text-white rounded-xl text-xs font-semibold px-6 py-2.5"
            >
              Start New Mock Interview
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-xl text-xs font-semibold px-6 py-2.5">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>

        {/* 3 Pillar Competency Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Technical Knowledge</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {finalReport.technicalKnowledgeAssessment}
            </p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Problem Solving</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {finalReport.problemSolvingAssessment}
            </p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Communication Clarity</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {finalReport.communicationObservations}
            </p>
          </Card>
        </div>

        {/* Strengths & Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Observed Strengths</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {finalReport.strengths?.map((str: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Areas for Improvement</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {finalReport.areasForImprovement?.map((area: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Topics to Revise & Recommended Resources */}
        <Card className="p-6 border-slate-200 dark:border-slate-800/80 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-700 dark:text-purple-300" />
            <span>Recommended Revision Topics & iGOT Resources</span>
          </h4>

          <div className="flex flex-wrap gap-2 mb-3">
            {finalReport.topicsToRevise?.map((topic: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-semibold"
              >
                {topic}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            {finalReport.recommendedResources?.map((res: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 text-xs space-y-1"
              >
                <h5 className="font-bold text-slate-900 dark:text-slate-100">{res.title}</h5>
                <p className="text-slate-500 dark:text-slate-400">{res.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================
  // 3. MOCK INTERVIEW HUB & SETUP SCREEN
  // ============================================================
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold mb-4 backdrop-blur-xs">
            <Bot className="w-3.5 h-3.5 text-purple-300" />
            <span>Claude AI Voice Interviewer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Voice Mock Technical & Behavioral Interviews
          </h1>
          <p className="text-sm text-purple-200/80 mt-2 leading-relaxed">
            Practice real-world job and technical interviews with real-time speech interaction, dynamic follow-up questioning, and instant Claude-generated performance diagnostics.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Setup Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Setup Configuration (7 Cols) */}
        <Card className="lg:col-span-7 p-8 border-slate-200 dark:border-slate-800/80 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-700 dark:text-purple-400" />
              <span>Configure Your Mock Interview</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your target role, difficulty level, and optional domain details
            </p>
          </div>

          <form onSubmit={handleStartInterview} className="space-y-5">
            {/* Target Role Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Target Role / Specialization
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TARGET_ROLES.map((r) => (
                  <button
                    key={r.title}
                    type="button"
                    onClick={() => setTargetRole(r.title)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      targetRole === r.title
                        ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold ring-1 ring-purple-600"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a29] text-slate-700 dark:text-slate-300 hover:border-purple-200"
                    }`}
                  >
                    <p className="truncate">{r.title}</p>
                    <span className="text-[10px] text-slate-400 font-normal">{r.stream}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty & Question Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Interview Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600"
                >
                  <option value="beginner">Beginner (Foundational / Junior)</option>
                  <option value="intermediate">Intermediate (Mid-Level / Applied)</option>
                  <option value="advanced">Advanced (Senior / Quantitative Specialist)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Number of Questions
                </label>
                <select
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600"
                >
                  <option value={3}>3 Questions (Fast Drill ~ 5 mins)</option>
                  <option value={5}>5 Questions (Standard ~ 10 mins)</option>
                  <option value={8}>8 Questions (In-Depth ~ 15 mins)</option>
                  <option value={10}>10 Questions (Comprehensive ~ 20 mins)</option>
                </select>
              </div>
            </div>

            {/* Optional Job Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Description / Specific Focus (Optional)
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities, required statistical tools, or topics to tailor question generation..."
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600"
              />
            </div>

            <Button
              type="submit"
              loading={starting}
              className="w-full bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold py-3 flex items-center justify-center gap-2 shadow-md shadow-purple-700/25 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start AI Voice Mock Interview</span>
            </Button>
          </form>
        </Card>

        {/* Right: Previous Interviews History (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border-slate-200 dark:border-slate-800/80">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              <span>Your Previous Mock Interviews ({history.length})</span>
            </h3>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((inv) => (
                  <div
                    key={inv._id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{inv.targetRole}</h4>
                        <Badge variant="purple" size="sm" className="capitalize text-[9px] px-1.5 py-0">
                          {inv.difficulty}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(inv.startedAt).toLocaleDateString()} • {inv.totalQuestionsAsked} questions
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {inv.overallScore !== null ? (
                        <Badge variant="emerald" size="sm">
                          {inv.overallScore}%
                        </Badge>
                      ) : (
                        <Badge variant="slate" size="sm">
                          In Progress
                        </Badge>
                      )}
                      <Link href={`/mock-interview/${inv._id}`}>
                        <Button size="sm" variant="outline" className="text-xs rounded-xl p-1.5">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No past interview sessions yet. Start your first mock interview on the left!
              </div>
            )}
          </Card>

          {/* Feature Highlights Card */}
          <Card className="p-6 bg-gradient-to-br from-purple-50/40 to-indigo-50/20 border-purple-100 dark:border-purple-900/40 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Voice Interaction Powered by Claude</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our AI interviewer analyzes your speech structure, technical depth, and reasoning speed, providing objective feedback without psychological assumptions.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
