"use client";

import React, { useEffect, useState, use } from "react";
import { mockInterviewApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Award,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowLeft,
  Bot,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function MockInterviewReportDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await mockInterviewApi.get(id);
        if (res.success && res.data) {
          setInterview(res.data);
        }
      } catch (err) {
        console.error("Failed to load interview", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!interview) {
    return (
      <Card className="max-w-md mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Interview Session Not Found</h3>
        <p className="text-xs text-slate-500">The requested mock interview session could not be located.</p>
        <Link href="/mock-interview">
          <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs">
            Back to Mock Interviews
          </Button>
        </Link>
      </Card>
    );
  }

  const report = interview.report;
  const questions = interview.questions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/mock-interview">
          <Button variant="outline" size="sm" className="text-xs rounded-xl flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Interviews</span>
          </Button>
        </Link>

        <Badge variant="purple" size="sm" className="capitalize">
          {interview.targetRole} • {interview.difficulty}
        </Badge>
      </div>

      {/* Top Report Header Card */}
      {report ? (
        <Card className="p-8 text-center bg-gradient-to-b from-white dark:from-[#181a29] to-purple-50/40 dark:to-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-lg">
          <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400">
            <Award className="w-8 h-8" />
          </div>

          <Badge variant="purple" size="md" className="mb-2">
            AI Interview Evaluation Summary
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {interview.targetRole} Mock Interview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conducted on {new Date(interview.startedAt).toLocaleDateString()}
          </p>

          <div className="mt-6 flex justify-center items-baseline gap-2">
            <span className="text-5xl font-black text-slate-900 dark:text-slate-100">
              {report.overallScore}%
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Overall Score
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto mt-4 leading-relaxed p-3 bg-white/70 dark:bg-[#121422] rounded-xl border border-slate-100 dark:border-slate-800">
            {report.summary}
          </p>
        </Card>
      ) : (
        <Card className="p-6 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Interview In Progress / Unfinished</h3>
          <p className="text-xs text-slate-500 mt-1">
            This interview session was saved before final report generation.
          </p>
        </Card>
      )}

      {/* 3 Pillar Competency Breakdown */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Technical Knowledge</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.technicalKnowledgeAssessment}
            </p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Problem Solving</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.problemSolvingAssessment}
            </p>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Communication Clarity</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {report.communicationObservations}
            </p>
          </Card>
        </div>
      )}

      {/* Full Q&A Transcript Review */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Complete Interview Transcript & Question Evaluations ({questions.length})</span>
        </h3>

        {questions.map((q: any, idx: number) => (
          <Card key={idx} className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                  Question {idx + 1} • {q.category?.toUpperCase() || "TECHNICAL"}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{q.question}</h4>
              </div>
              {q.evaluation?.relevanceScore && (
                <Badge variant="emerald" size="sm">
                  Relevance: {q.evaluation.relevanceScore}%
                </Badge>
              )}
            </div>

            {/* Candidate Answer */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#181a29] rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Answer:
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                {q.userAnswer || "No answer recorded."}
              </p>
            </div>

            {/* Claude AI Evaluation Feedback */}
            {q.evaluation && (
              <div className="p-3.5 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900 dark:text-purple-300">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Claude Evaluator Feedback:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{q.evaluation.feedback}</p>
                {q.evaluation.strengths?.length > 0 && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    <span className="font-semibold">Strength: </span>
                    {q.evaluation.strengths.join(", ")}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
