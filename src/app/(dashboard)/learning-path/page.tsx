"tsx"
"use client";

import React, { useEffect, useState } from "react";
import { learningPathsApi, coursesApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  GitFork,
  Star,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";

export default function LearningPathPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"my-path" | "all-paths">("my-path");

  const loadData = async () => {
    try {
      setLoading(true);
      const [pathRes, courseRes] = await Promise.all([
        learningPathsApi.list(),
        coursesApi.list(),
      ]);

      if (pathRes.success && pathRes.data) {
        setLearningPaths(pathRes.data as any[]);
      }
      if (courseRes.success && courseRes.data) {
        setCourses((courseRes.data as any).courses || []);
      }
    } catch (err) {
      console.error("Failed to load learning path", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateNewPath = async () => {
    try {
      setGenerating(true);
      const res = await learningPathsApi.generate();
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to generate path", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const currentPath = learningPaths.find((p) => p.status === "active") || learningPaths[0];
  const hasPath = Boolean(currentPath && currentPath.weeks);
  const weeks = currentPath?.weeks || {};

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Learning Path
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your Personalized AI-Engineered Learning Journey
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("my-path")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "my-path"
                  ? "bg-white dark:bg-[#181a29] text-purple-700 dark:text-purple-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              My Path
            </button>
            <button
              onClick={() => setActiveTab("all-paths")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all-paths"
                  ? "bg-white dark:bg-[#181a29] text-purple-700 dark:text-purple-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All Paths
            </button>
          </div>

          <Button
            onClick={handleGenerateNewPath}
            loading={generating}
            className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate New AI Plan</span>
          </Button>
        </div>
      </div>

      {hasPath ? (
        /* 2. MAIN LEARNING PATH VIEW (When user has generated paths) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Path Overview & Roadmap */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white border-0 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-wider text-purple-300">
                      Current Active Path
                    </span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">
                      {currentPath?.planMetadata?.title || "Targeted Competency Progression"}
                    </h2>
                    <p className="text-xs text-purple-200/80 mt-1 max-w-lg">
                      {currentPath?.planMetadata?.description ||
                        "Targeted 4-week progression to eliminate identified competency deficits."}
                    </p>
                  </div>
                  <Badge variant="purple" size="sm" className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                    Active
                  </Badge>
                </div>

                <div className="mt-6 pt-6 border-t border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 max-w-sm">
                    <div className="flex justify-between text-xs font-semibold text-purple-200 mb-1.5">
                      <span>Overall Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full bg-purple-950/60 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-400 to-indigo-300 h-full w-[0%] rounded-full" />
                    </div>
                  </div>
                  <div className="text-xs text-purple-300 font-medium">
                    Estimated Completion: <span className="text-white font-bold">4 weeks</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 4-Week Progression Roadmap Accordion / Cards */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">4-Week Structured Curriculum</h3>

              {["week1", "week2", "week3", "week4"].map((weekKey, index) => {
                const weekData = weeks[weekKey] || {
                  weekNumber: index + 1,
                  theme:
                    index === 0
                      ? "Foundation"
                      : index === 1
                      ? "Weak Concept Practice"
                      : index === 2
                      ? "Applied Practice"
                      : "Reassessment",
                  focusArea:
                    index === 0
                      ? "Core Concepts & Theoretical Framework"
                      : index === 1
                      ? "Targeted Drills on Identified Deficiencies"
                      : index === 2
                      ? "Real-World Scenarios & Case Analysis"
                      : "Mastery Verification & Reassessment Exam",
                  tasks: [
                    { title: `Module ${index + 1}.1 Core Tutorial`, duration: 45, status: "pending" },
                    { title: `Module ${index + 1}.2 Interactive Practice`, duration: 30, status: "pending" },
                  ],
                };

                const isWeekCurrent = index === 0;

                return (
                  <Card
                    key={weekKey}
                    className={`p-5 transition-all ${
                      isWeekCurrent
                        ? "border-purple-300 dark:border-purple-700 shadow-md bg-purple-50/20 dark:bg-purple-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isWeekCurrent
                              ? "bg-purple-700 text-white shadow-md shadow-purple-600/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          W{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                              Week {index + 1} — {weekData.theme}
                            </span>
                            {isWeekCurrent && <Badge variant="purple" size="sm">Current Sprint</Badge>}
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                            {weekData.focusArea}
                          </h4>

                          {/* Task items list */}
                          <div className="mt-3 space-y-2">
                            {weekData.tasks?.map((task: any, tIdx: number) => (
                              <div
                                key={tIdx}
                                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-white dark:bg-[#181a29] border border-slate-100 dark:border-slate-800/80"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    {task.title}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                  {task.estimatedMinutes || task.duration || 30} mins
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isWeekCurrent ? (
                          <Button size="sm" className="bg-purple-700 dark:bg-purple-600 text-white text-xs rounded-xl">
                            Start Sprint
                          </Button>
                        ) : (
                          <Badge variant="slate" size="sm">Upcoming</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Path Modules Progress Checklist */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Path Modules</h3>
              <div className="space-y-3">
                {[
                  { num: 1, title: "Foundational Statistical Concepts", status: "In Progress", pct: 0, active: true },
                  { num: 2, title: "Core Applied Methodologies", status: "Pending", pct: 0 },
                  { num: 3, title: "Data Interpretation & Analysis", status: "Pending", pct: 0 },
                  { num: 4, title: "Advanced Problem Solving", status: "Pending", pct: 0 },
                  { num: 5, title: "Practical Case Studies", status: "Pending", pct: 0 },
                  { num: 6, title: "Mastery Reassessment", status: "Pending", pct: 0 },
                ].map((m) => (
                  <div
                    key={m.num}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      m.active
                        ? "border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/30"
                        : "border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#181a29]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                          m.active
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {m.num}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{m.status}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{m.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty State for Fresh Learner */
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center border border-purple-100 dark:border-purple-900/50">
            <GitFork className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Learning Path Generated Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Complete a diagnostic assessment or click below to generate your personalized 4-week learning path based on your evaluated skill profile.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/assessments">
              <Button variant="outline" className="text-xs rounded-xl">
                <FileCheck2 className="w-4 h-4" />
                <span>Take Diagnostic Assessment</span>
              </Button>
            </Link>
            <Button
              onClick={handleGenerateNewPath}
              loading={generating}
              className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-xs rounded-xl"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Plan</span>
            </Button>
          </div>
        </Card>
      )}

      {/* 3. RECOMMENDED iGOT COURSES ROW */}
      <div className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recommended iGOT Courses</h3>
          <Link
            href="/igot-courses"
            className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
          >
            View All Courses &gt;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course, idx) => (
            <Card
              key={course._id || idx}
              className="p-5 flex flex-col justify-between hover:border-purple-200 dark:hover:border-purple-800/60"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    4.{8 - (idx % 2)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{course.title}</h4>
                <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mt-1">iGOT Karmayogi Course</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {3 + idx} weeks</span>
                  <span>•</span>
                  <span>Self-paced</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Link href="/igot-courses">
                  <Button variant="secondary" className="w-full text-xs font-semibold py-2 rounded-xl">
                    Course Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
