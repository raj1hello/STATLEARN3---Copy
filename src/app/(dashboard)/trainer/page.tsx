"use client";

import React, { useEffect, useState } from "react";
import { assessmentsApi, competenciesApi, trainerLearnersApi, connectionsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { GraduationCap, UploadCloud, Sparkles, FileCheck2, BookOpen, Plus, ArrowRight, CheckCircle2, Users, Send } from "lucide-react";
import Link from "next/link";

export default function TrainerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [learnersCount, setLearnersCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [assRes, compRes, learnersRes, reqRes] = await Promise.all([
          assessmentsApi.list({ myOnly: true }),
          competenciesApi.list(),
          trainerLearnersApi.list(),
          connectionsApi.list("pending"),
        ]);
        if (assRes.success && assRes.data) setAssessments(assRes.data as any[]);
        if (compRes.success && compRes.data) setCompetencies(compRes.data as any[]);
        if (learnersRes.success && learnersRes.data) setLearnersCount(learnersRes.data.total || 0);
        if (reqRes.success && reqRes.data) setPendingCount(reqRes.data.total || 0);
      } catch (err) {
        console.error("Failed to load trainer data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const publishedCount = assessments.filter((a) => a.published).length;
  const draftCount = assessments.filter((a) => !a.published).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Trainer Studio</span>
            <Badge variant="blue" size="sm">
              Trainer Mode
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Author Training Materials, Generate AI Assessments & Review Diagnostic Questions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/trainer/learners">
            <Button variant="outline" className="rounded-xl text-xs font-semibold flex items-center gap-1.5 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300">
              <Users className="w-4 h-4" />
              <span>My Learners</span>
              {pendingCount > 0 && (
                <Badge variant="amber" size="sm">
                  {pendingCount} new
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/trainer/materials">
            <Button variant="outline" className="rounded-xl text-xs font-semibold">
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Button>
          </Link>
          <Link href="/trainer/quizzes">
            <Button className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Quiz Generator</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published Assessments</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{publishedCount}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Live to learners</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Draft AI Quizzes</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{draftCount}</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Needs review</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Link href="/trainer/learners">
          <Card className="p-6 hover:border-purple-300 dark:hover:border-purple-800 transition cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Connected Learners</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{learnersCount}</span>
                  {pendingCount > 0 ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">+{pendingCount} pending</span>
                  ) : (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Active</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Competencies</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{competencies.length}</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Mapped framework</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-purple-50/60 dark:from-purple-950/40 to-indigo-50/40 dark:to-indigo-950/20 border-purple-200 dark:border-purple-900/60 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Upload Training Materials</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Upload PDF manuals or text curricula. Our AI automatically extracts semantic chunks and generates topic summaries.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/trainer/materials">
              <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold py-2.5">
                Go to Document Uploader
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50/60 dark:from-blue-950/40 to-purple-50/40 dark:to-purple-950/20 border-blue-200 dark:border-blue-900/60 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Assessment Generator</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Generate 10+ validated multiple choice questions or scenarios. Review draft answers and publish when satisfied.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/trainer/quizzes">
              <Button variant="secondary" className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-xl text-xs font-semibold py-2.5">
                Open Quiz Studio
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Managed Assessments List */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Your Authored Assessments</h3>
        {assessments.length > 0 ? (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div key={a._id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{a.title}</h4>
                    <Badge variant={a.published ? "emerald" : "amber"} size="sm">
                      {a.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Type: {a.type?.toUpperCase()}</p>
                </div>

                <Link href={`/trainer/quizzes?id=${a._id}`}>
                  <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl">
                    Edit & Review
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No authored assessments yet. Use the AI Quiz Generator to create one!
          </div>
        )}
      </Card>
    </div>
  );
}
