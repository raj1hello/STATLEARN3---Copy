"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { analyticsApi, gapAnalysisApi, recommendationsApi, assignmentsApi } from "@/lib/api/client";
import { MaterialViewerModal } from "@/components/learner/MaterialViewerModal";
import { NoteViewerModal } from "@/components/learner/NoteViewerModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { GaugeChart } from "@/components/charts/DonutChart";
import { LineChart } from "@/components/charts/LineChart";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  FileCheck2,
  Flame,
  ChevronRight,
  BrainCircuit,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  UserCheck,
  Calendar,
} from "lucide-react";

export default function LearnerDashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [learnerAnalytics, setLearnerAnalytics] = useState<any>(null);
  const [gapData, setGapData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "new" | "in_progress" | "completed">("all");

  // Material & Note viewer states
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);
  const [viewingMaterialAssignmentId, setViewingMaterialAssignmentId] = useState<string | undefined>(undefined);
  const [viewingMaterialStatus, setViewingMaterialStatus] = useState<string | undefined>(undefined);
  const [viewingNoteAssignment, setViewingNoteAssignment] = useState<any | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [analyticsRes, gapRes, recRes, assignRes] = await Promise.all([
          analyticsApi.getLearner(),
          gapAnalysisApi.get(),
          recommendationsApi.get(),
          assignmentsApi.list(),
        ]);

        if (analyticsRes.success) setLearnerAnalytics(analyticsRes.data);
        if (gapRes.success) setGapData(gapRes.data);
        if (recRes.success && recRes.data) {
          setRecommendations((recRes.data as any).recommendations || []);
        }
        if (assignRes.success && assignRes.data) {
          setAssignments(assignRes.data.assignments || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleOpenAssignment = async (item: any) => {
    // If status is new, transition to in_progress immediately
    if (item.status === "new") {
      assignmentsApi.updateStatus(item._id, "in_progress");
      setAssignments((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, status: "in_progress" } : a))
      );
    }

    const type = item.content?.type;
    const refId = item.content?.refId;

    if (type === "material") {
      setViewingMaterialId(refId);
      setViewingMaterialAssignmentId(item._id);
      setViewingMaterialStatus(item.status === "new" ? "in_progress" : item.status);
    } else if (type === "note") {
      setViewingNoteAssignment({
        ...item,
        status: item.status === "new" ? "in_progress" : item.status,
      });
    } else if (type === "assessment" || type === "quiz") {
      router.push(`/assessments/${refId}`);
    } else if (type === "stream_test") {
      router.push(`/stream-tests/${refId}`);
    }
  };

  const handleMarkDone = async (item: any) => {
    try {
      const res = await assignmentsApi.updateStatus(item._id, "completed");
      if (res.success) {
        setAssignments((prev) =>
          prev.map((a) => (a._id === item._id ? { ...a, status: "completed" } : a))
        );
      }
    } catch (err) {
      console.error("Failed to mark done", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.email?.split("@")[0] || "Learner";
  const overallScore = learnerAnalytics?.summary?.overallAverageCompetencyScore ?? 0;
  const totalAssessments = learnerAnalytics?.summary?.totalAssessmentsTaken ?? 0;
  const competencies = learnerAnalytics?.competencies?.all || [];
  const recentEvents = learnerAnalytics?.recentProgressEvents || [];
  const improvementPoints = learnerAnalytics?.summary?.overallImprovementPoints ?? 0;

  // Real gap data from backend
  const gaps = gapData?.competencies || [];
  const topGap = gaps.find((g: any) => g.severity === "high") || gaps[0];

  // Progress Trend Data
  const hasHistory = recentEvents.length > 0 || totalAssessments > 0;
  const trendData = hasHistory
    ? [
        { name: "Initial", score: Math.max(0, overallScore - improvementPoints) },
        { name: "Current", score: overallScore },
      ]
    : [];

  // Trainer-Assigned Content (filtered by tab)
  const filteredAssignments = assignments.filter((a) =>
    assignmentFilter === "all" ? true : a.status === assignmentFilter
  );
  const typeStyles: Record<
    string,
    { bg: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    assessment: { bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400", icon: FileCheck2 },
    quiz: { bg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400", icon: BrainCircuit },
    stream_test: { bg: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400", icon: Layers },
    material: { bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400", icon: BookOpen },
    note: { bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400", icon: FileText },
  };
  const statusVariant: Record<string, "amber" | "blue" | "emerald"> = {
    new: "amber",
    in_progress: "blue",
    completed: "emerald",
  };

  return (
    <div className="space-y-6">
      {/* 1. WELCOME BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#11131f] p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-card">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Good morning, {displayName}!</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {recommendations.length > 0
              ? `Let's continue your learning journey today. You have ${recommendations.length} recommended learning actions.`
              : "Welcome to STATLEARN. Start by taking your first competency assessment."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={totalAssessments > 0 ? "/learning-path" : "/assessments"}>
            <Button className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl shadow-xs font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{totalAssessments > 0 ? "Continue Learning" : "Take Assessment"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. TOP 4 METRIC STAT TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Overall Competency with Gauge */}
        <Card className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Competency</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{overallScore}%</span>
              {improvementPoints > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">↗ +{improvementPoints}%</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {totalAssessments > 0 ? "across assessed competencies" : "no assessments taken yet"}
            </p>
          </div>
          <GaugeChart value={overallScore} size={68} />
        </Card>

        {/* Metric 2: Completed Courses */}
        <Card className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed Courses</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {learnerAnalytics?.summary?.completedCourses ?? (totalAssessments > 1 ? 2 : 0)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">enrolled modules</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-900/50">
            <BookOpen className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 3: Assessments Taken */}
        <Card className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assessments Taken</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{totalAssessments}</span>
              {totalAssessments > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">completed</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">diagnostic evaluations</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </Card>

        {/* Metric 4: Current Streak */}
        <Card className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Streak</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {totalAssessments > 0 ? 1 : 0}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">day{totalAssessments > 1 ? "s" : ""}</span>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
              {totalAssessments > 0 ? "Active learner" : "Start your streak"}
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/50">
            <Flame className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* 3. MIDDLE SECTION: Competency Overview + Skill Gap + Next Step */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competency Overview Progress Bars */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Competency Overview</h3>
            <Link href="/competencies" className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300">
              View All &gt;
            </Link>
          </div>

          <div className="space-y-4">
            {competencies.length > 0 ? (
              competencies.slice(0, 5).map((comp: any) => (
                <div key={comp.competencyId} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300">{comp.competencyName || comp.name || "Competency"}</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{comp.currentScore}%</span>
                  </div>
                  <ProgressBar
                    value={comp.currentScore}
                    target={comp.targetScore}
                    color={comp.currentScore >= 75 ? "purple" : comp.currentScore >= 60 ? "blue" : "amber"}
                    size="sm"
                  />
                </div>
              ))
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  No competencies evaluated yet.
                </p>
                <Link href="/assessments">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl mt-2">
                    Take First Assessment
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Skill Gap Analysis Card */}
        <Card className="lg:col-span-1 p-6 flex flex-col justify-between border-purple-100 dark:border-purple-900/40">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Skill Gap Analysis</h3>
              <Link href="/gap-analysis" className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300">
                View Details &gt;
              </Link>
            </div>

            {topGap ? (
              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={topGap.severity === "high" ? "red" : "amber"} size="sm">
                    {topGap.severity === "high" ? "High Priority" : "Identified Gap"}
                  </Badge>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">Gap: {topGap.gap}%</span>
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{topGap.competencyName}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {topGap.explanation || "Deficits identified in recent assessment. Targeted practice recommended."}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 rounded-2xl bg-slate-50 dark:bg-[#181a29] border border-slate-100 dark:border-slate-800/80 mb-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No skill gaps identified yet</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Complete your diagnostic assessment to identify competency gaps.
                </p>
              </div>
            )}
          </div>

          <Link href={topGap ? "/gap-analysis" : "/assessments"}>
            <Button className="w-full bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold py-2.5">
              {topGap ? "Improve Now" : "Start Assessment"}
            </Button>
          </Link>
        </Card>

        {/* Recommended Next Step Card */}
        <Card className="lg:col-span-1 p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Recommended Next Step</h3>
              <Link href="/recommendations" className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300">
                All Courses &gt;
              </Link>
            </div>

            {recommendations.length > 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#181a29] border border-slate-200/70 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-semibold mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span>iGOT Karmayogi Course</span>
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {recommendations[0]?.courseTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {recommendations[0]?.reason}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 rounded-2xl bg-slate-50 dark:bg-[#181a29] border border-slate-100 dark:border-slate-800/80 mb-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No course recommendations yet</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Recommendations are generated automatically based on your assessment results.
                </p>
              </div>
            )}
          </div>

          <Link href={recommendations.length > 0 ? "/learning-path" : "/assessments"}>
            <Button variant="secondary" className="w-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 rounded-xl text-xs font-semibold py-2.5">
              {recommendations.length > 0 ? "Start Course" : "Explore Assessments"}
            </Button>
          </Link>
        </Card>
      </div>

      {/* 4. TRAINER-ASSIGNED CONTENT */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Assigned by Trainer
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Diagnostic evaluations, practice tasks, and notes from your connected trainers
              </p>
            </div>
          </div>

          {assignments.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1 self-start sm:self-auto">
              {(["all", "new", "in_progress", "completed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAssignmentFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition ${
                    assignmentFilter === f
                      ? "bg-white dark:bg-[#181a29] text-purple-700 dark:text-purple-300 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>

        {assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((item) => {
              const tStyle = typeStyles[item.content?.type] || {
                bg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
                icon: Send,
              };
              const TypeIcon = tStyle.icon;
              const isReadTask =
                item.content?.type === "material" || item.content?.type === "note";
              return (
                <Card
                  key={item._id}
                  className="p-5 bg-white dark:bg-[#11131f] border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/80 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${tStyle.bg}`}>
                      <TypeIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.content?.title}
                        </h4>
                        <Badge
                          variant={statusVariant[item.status] || "slate"}
                          size="sm"
                          className="capitalize shrink-0"
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>From {item.trainerName || "Your Trainer"}</span>
                      </p>
                    </div>
                  </div>

                  {item.message && (
                    <p className="mt-3 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                      &quot;{item.message}&quot;
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
                    <Badge variant="purple" size="sm" className="capitalize">
                      {item.content?.type?.replace("_", " ")}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Assigned {new Date(item.assignedAt).toLocaleDateString()}
                    </span>
                    {item.dueAt && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="w-3 h-3" />
                        Due {new Date(item.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    {item.completedAt && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed {new Date(item.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Button
                      onClick={() => handleOpenAssignment(item)}
                      className="flex-1 bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold py-2 flex items-center justify-center gap-1.5"
                    >
                      {isReadTask ? (
                        <BookOpen className="w-3.5 h-3.5" />
                      ) : (
                        <FileCheck2 className="w-3.5 h-3.5" />
                      )}
                      <span>{item.status === "completed" ? "View Again" : "Open Task"}</span>
                    </Button>
                    {isReadTask && item.status !== "completed" && (
                      <Button
                        variant="outline"
                        onClick={() => handleMarkDone(item)}
                        className="rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 py-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-10 text-center space-y-3 border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent shadow-none">
            <Send className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              No Assigned Tasks Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Connect with a trainer to start receiving diagnostic assessments, practice quizzes,
              learning materials, and personalized study notes.
            </p>
            <Link href="/trainers">
              <Button
                variant="outline"
                className="mt-2 rounded-xl text-xs font-semibold border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-4"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Find a Trainer</span>
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* 5. BOTTOM SECTION: Recent Activity + Progress Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Recent Activity</h3>
            <Link href="/progress" className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300">
              View History &gt;
            </Link>
          </div>

          <div className="space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((act: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {act.metric === "assessment_score"
                          ? `Assessment Score: ${act.value}%`
                          : `Progress Update: ${act.metric}`}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(act.recordedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No recent activity. Complete an assessment to start recording your progress.
              </div>
            )}
          </div>
        </Card>

        {/* Progress Over Time Chart */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Progress Over Time</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Score advancement across milestone checkpoints</p>
            </div>
            {improvementPoints > 0 && (
              <Badge variant="purple" size="sm">
                +{improvementPoints}% Growth
              </Badge>
            )}
          </div>
          {trendData.length > 0 ? (
            <LineChart data={trendData} height={200} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No trend data recorded yet. Complete assessments to track your growth over time.
            </div>
          )}
        </Card>
      </div>

      {/* Trainer-Assigned Material & Note Viewers */}
      <MaterialViewerModal
        isOpen={Boolean(viewingMaterialId)}
        onClose={() => setViewingMaterialId(null)}
        materialId={viewingMaterialId || ""}
        assignmentId={viewingMaterialAssignmentId}
        assignmentStatus={viewingMaterialStatus}
        onStatusChange={() => {
          setAssignments((prev) =>
            prev.map((a) =>
              a._id === viewingMaterialAssignmentId ? { ...a, status: "completed" } : a
            )
          );
        }}
      />
      <NoteViewerModal
        isOpen={Boolean(viewingNoteAssignment)}
        onClose={() => setViewingNoteAssignment(null)}
        assignment={viewingNoteAssignment}
        onStatusChange={() => {
          setAssignments((prev) =>
            prev.map((a) =>
              a._id === viewingNoteAssignment?._id ? { ...a, status: "completed" } : a
            )
          );
        }}
      />
    </div>
  );
}
