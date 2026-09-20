"use client";

import React from "react";
import Link from "next/link";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import {
  formatDate,
  formatDateTime,
  initials,
  AssignmentStatusBadge,
  PassFailBadge,
  NoLinkedLearner,
} from "@/components/parent/parentShared";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  GraduationCap,
  FileCheck2,
  BrainCircuit,
  Layers,
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  UserCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  CalendarDays,
  Sparkles,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Derive a one-line grade label from a 0-100 score. */
function gradeLabel(score: number): { label: string; variant: "emerald" | "blue" | "amber" | "red" } {
  if (score >= 85) return { label: "Outstanding", variant: "emerald" };
  if (score >= 70) return { label: "Good", variant: "blue" };
  if (score >= 50) return { label: "Developing", variant: "amber" };
  return { label: "Needs Support", variant: "red" };
}

/** Kind label → icon component */
function KindIcon({ kind, className }: { kind: string; className?: string }) {
  if (kind === "quiz") return <BrainCircuit className={className} />;
  if (kind === "stream_test") return <Layers className={className} />;
  return <FileCheck2 className={className} />;
}

/** Kind label → colour classes for the icon tile */
function kindColour(kind: string) {
  if (kind === "quiz") return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400";
  if (kind === "stream_test") return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400";
  return "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400";
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ParentOverviewPage() {
  const { data } = useParentReport();
  if (!data?.report) return <NoLinkedLearner section="This overview" />;

  const {
    learner,
    trainers,
    summary,
    competencies,
    timeline,
    assignments,
    materials,
    attempts,
    progress,
  } = data.report;

  const displayName = learner.name || "Learner";
  const trainer = trainers?.[0] ?? null;

  // Last meaningful activity date — most recent timeline event date
  const lastActivityDate = (timeline ?? [])[0]?.date ?? null;

  // Most recent attempt date (chronological sort already done server-side on timeline)
  const lastAttempt = (attempts ?? [])
    .slice()
    .sort((a: any, b: any) =>
      new Date(b.completedAt || b.startedAt || 0).getTime() -
      new Date(a.completedAt || a.startedAt || 0).getTime()
    )[0] ?? null;

  const grade = gradeLabel(summary.overallCompetencyScore);

  // Top 4 competencies by current score (strengths)
  const strengths = [...(competencies ?? [])]
    .sort((a: any, b: any) => (b.currentScore || 0) - (a.currentScore || 0))
    .slice(0, 4);

  // Competencies below their own target score, weakest first
  const gaps = [...(competencies ?? [])]
    .filter((c: any) => (c.currentScore || 0) < (c.targetScore ?? 100))
    .sort((a: any, b: any) => (a.currentScore || 0) - (b.currentScore || 0))
    .slice(0, 4);

  // Recent test attempts (assessments + quizzes + stream tests), newest first
  const recentAttempts = (attempts ?? [])
    .slice()
    .sort((a: any, b: any) =>
      new Date(b.completedAt || b.startedAt || 0).getTime() -
      new Date(a.completedAt || a.startedAt || 0).getTime()
    )
    .slice(0, 5);

  // Progress summary rows — tasks status breakdown
  const taskRows = [
    { label: "Completed", count: summary.assignmentsCompleted, dot: "bg-emerald-500" },
    { label: "In Progress", count: summary.assignmentsInProgress, dot: "bg-blue-500" },
    { label: "Pending",     count: summary.assignmentsNew,       dot: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8">

      {/* ── 1. STUDENT IDENTITY HEADER ─────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-[#11131f] border border-slate-100 dark:border-slate-800/80 shadow-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        {/* accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />

        <div className="p-6 pt-7 flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-lg shadow-purple-600/25 select-none">
            {initials(displayName)}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {displayName}
              </h1>
              <Badge variant={grade.variant} size="md">{grade.label}</Badge>
              {learner.stream && (
                <Badge variant="slate" size="sm">{learner.stream}</Badge>
              )}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {[learner.designation, learner.department].filter(Boolean).join(" · ") || "Learner"}
              {learner.careerGoal && (
                <span className="text-slate-400 dark:text-slate-500"> · Goal: {learner.careerGoal}</span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              {trainer && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  Trainer: <span className="font-medium text-slate-700 dark:text-slate-300">{trainer.name}</span>
                </span>
              )}
              {learner.joinedAt && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  Enrolled {formatDate(learner.joinedAt)}
                </span>
              )}
              {lastActivityDate && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last active {formatDate(lastActivityDate)}
                </span>
              )}
            </div>
          </div>

          {/* Read-only badge */}
          <div className="shrink-0">
            <Badge variant="slate" size="sm" className="gap-1">
              <UserCheck className="w-3 h-3" /> Parent view
            </Badge>
          </div>
        </div>
      </div>

      {/* ── 2. OVERALL PERFORMANCE + 3. REPORT-CARD SUMMARY ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Overall score card */}
        <Card className="flex flex-col items-center justify-center text-center py-8 gap-3">
          {/* Large score ring — simple CSS circle */}
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor"
                className="text-slate-100 dark:text-slate-800" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - summary.overallCompetencyScore / 100)}`}
                className="transition-all duration-700" />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {summary.overallCompetencyScore}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">/ 100</span>
            </div>
          </div>

          <div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">Overall Score</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {summary.competencies > 0
                ? `Avg. across ${summary.competencies} competenc${summary.competencies === 1 ? "y" : "ies"}`
                : "No competencies tracked yet"}
            </p>
          </div>

          <Badge variant={grade.variant} size="md" className="mt-1">{grade.label}</Badge>
        </Card>

        {/* Report-card summary grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Assessments",
              value: summary.assessmentsCompleted,
              icon: FileCheck2,
              note: "completed",
              accent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50",
            },
            {
              label: "Quizzes",
              value: summary.quizzesCompleted,
              icon: BrainCircuit,
              note: "completed",
              accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
            },
            {
              label: "Stream Tests",
              value: summary.streamTestsCompleted,
              icon: Layers,
              note: "completed",
              accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
            },
            {
              label: "Competencies",
              value: summary.competencies,
              icon: Award,
              note: "tracked",
              accent: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
            },
            {
              label: "Tasks",
              value: `${summary.assignmentsCompleted} / ${summary.assignmentsTotal}`,
              icon: CheckCircle2,
              note: "done",
              accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
            },
            {
              label: "Materials",
              value: materials.length,
              icon: BookOpen,
              note: "assigned",
              accent: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
            },
          ].map(({ label, value, icon: Icon, note, accent }) => (
            <Card key={label} className="flex flex-col gap-3 py-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
                <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label} <span className="text-slate-400">{note}</span></div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── 4 & 5. STRENGTHS + AREAS TO IMPROVE ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Strengths</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Highest performing subjects</p>
            </div>
          </div>

          {strengths.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
              No competency data recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {strengths.map((c: any) => {
                const meetsTarget = (c.currentScore || 0) >= (c.targetScore ?? 100);
                return (
                  <div key={c._id?.toString() || c.competencyName}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
                        {c.competencyName}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {meetsTarget && (
                          <Badge variant="emerald" size="sm">On target</Badge>
                        )}
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 w-10 text-right">
                          {c.currentScore}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={c.currentScore ?? 0}
                      target={c.targetScore ?? 100}
                      color="emerald"
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Areas to improve */}
        <Card>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Areas to Focus On</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Subjects with room to grow</p>
            </div>
          </div>

          {gaps.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Sparkles className="w-7 h-7 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                All targets met — great work!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {displayName} is meeting or exceeding the target score in every competency.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gaps.map((c: any) => {
                const deficit = (c.targetScore ?? 100) - (c.currentScore || 0);
                return (
                  <div key={c._id?.toString() || c.competencyName}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug">
                        {c.competencyName}
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0 ml-2">
                        {deficit} pts to target
                      </span>
                    </div>
                    <ProgressBar
                      value={c.currentScore ?? 0}
                      target={c.targetScore ?? 100}
                      color="amber"
                      size="sm"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>Current: {c.currentScore}%</span>
                      <span>Target: {c.targetScore ?? 100}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── 6. RECENT PERFORMANCE ─────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Performance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest assessments, quizzes and stream tests</p>
            </div>
          </div>
          <Link
            href="/parent/assessments"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
            No assessments or quizzes completed yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentAttempts.map((a: any) => (
              <div
                key={a._id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 first:pt-0 last:pb-0"
              >
                {/* Kind icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${kindColour(a.kind)}`}>
                  <KindIcon kind={a.kind} className="w-4 h-4" />
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {a.kindLabel}
                    {a.stream && <span> · {a.stream}</span>}
                    <span className="mx-1">·</span>
                    {formatDate(a.completedAt || a.startedAt)}
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.percentage}%</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">Score {a.score}</div>
                  </div>
                  <PassFailBadge passed={a.passed} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 7. LEARNING PROGRESS ──────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Learning Progress</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current standing across all competencies</p>
            </div>
          </div>
          <Link
            href="/parent/progress"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
          >
            Full progress <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Competency progress bars — the most meaningful "progress" view */}
        {(competencies ?? []).length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
            No competency progress recorded yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {(competencies as any[]).slice(0, 8).map((c: any) => (
              <div key={c._id?.toString() || c.competencyName}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate pr-2">
                    {c.competencyName}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 shrink-0">
                    {c.currentScore}%
                  </span>
                </div>
                <ProgressBar
                  value={c.currentScore ?? 0}
                  target={c.targetScore ?? 100}
                  color="purple"
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Task completion summary */}
        {summary.assignmentsTotal > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
            {taskRows.map(({ label, count, dot }) => (
              <div key={label}>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                </div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{count}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── 8. ASSIGNED LEARNING + 9. TRAINER (side-by-side on desktop) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Assigned materials */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Assigned Learning</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Materials your trainer has assigned</p>
              </div>
            </div>
            <Link
              href="/parent/materials"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {materials.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
              No learning materials assigned yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {materials.slice(0, 4).map((m: any) => (
                <li key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{m.fileName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Assigned {formatDate(m.assignedAt)}</p>
                  </div>
                  <AssignmentStatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Trainer / guidance */}
        <Card>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Trainer & Guidance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Who is supporting this learner</p>
            </div>
          </div>

          {!trainer ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <UserCheck className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No trainer connected yet.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                A trainer can be connected directly from the learner&apos;s account.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white text-lg font-black shrink-0 select-none">
                {initials(trainer.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{trainer.name}</p>
                  <Badge variant="emerald" size="sm">
                    <GraduationCap className="w-3 h-3" /> Connected
                  </Badge>
                </div>
                {trainer.designation && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{trainer.designation}</p>
                )}
                {trainer.department && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">{trainer.department}</p>
                )}
                {trainer.email && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{trainer.email}</p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── 10. RECENT ACTIVITY ────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">What {displayName} has been doing lately</p>
            </div>
          </div>
          <Link
            href="/parent/history"
            className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0"
          >
            Full history <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {(!timeline || timeline.length === 0) ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
            No activity recorded yet.
          </p>
        ) : (
          <ol className="relative space-y-0">
            {(timeline as any[]).slice(0, 8).map((e: any, idx: number, arr: any[]) => (
              <li key={`${e.id}-${idx}`} className="relative flex gap-4 pb-5 last:pb-0">
                {/* connector line */}
                {idx < arr.length - 1 && (
                  <span className="absolute left-[13px] top-6 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
                )}

                {/* dot */}
                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 z-10">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                </span>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">{e.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {e.label}
                    <span className="mx-1">·</span>
                    {formatDateTime(e.date)}
                    {typeof e.meta?.score !== "undefined" && (
                      <span className="ml-1 font-medium text-slate-600 dark:text-slate-300">
                        · Score {e.meta.score}
                        {typeof e.meta.percentage === "number" && ` (${e.meta.percentage}%)`}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

    </div>
  );
}
