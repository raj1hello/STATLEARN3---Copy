"use client";

import React, { useEffect, useState } from "react";
import { organizationApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { DonutChart } from "@/components/charts/DonutChart";
import { LineChart } from "@/components/charts/LineChart";
import {
  Building2,
  Users,
  Award,
  TrendingUp,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

export default function OrganizationDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await organizationApi.getAnalytics();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load organization dashboard", err);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const streamDist = data?.streamDistribution || [];
  const skillDist = data?.skillDistribution || [];
  const scoreDist = data?.scoreDistribution || [];
  const perfTrends = data?.performanceTrends || [];

  const streamDonutData = streamDist.map((item: any, idx: number) => {
    const colors = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];
    return {
      name: item.name,
      value: item.students,
      color: colors[idx % colors.length],
    };
  });

  const trendChartData = perfTrends.map((t: any) => ({
    name: t.month.split(" ")[0],
    score: t.averageScore,
  }));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>College & Organization Intelligence</span>
            <Badge variant="emerald" size="sm">
              Institutional View
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregate cohort analytics, stream distributions, competency gap detection, and industry talent discovery
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/organization/students">
            <Button className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Discover Consented Talent</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. TOP 4 METRIC STAT TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Enrolled Students</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{overview.totalStudents ?? 0}</span>
            {overview.totalStudents > 0 && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across all academic streams</p>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Assessment Score</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{overview.averageAssessmentScore ?? 0}%</span>
            {overview.completedAssessments > 0 && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{overview.trendDirection || ""} Active</span>}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cohort benchmark score</p>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assessment Participation</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{overview.participationRate ?? "0%"}</span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{overview.completedAssessments ?? 0} tests</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Continuous diagnostic tests</p>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Industry Discoverable Profiles</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{overview.consentingStudents ?? 0}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Consented</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Verified skill sets published</p>
        </Card>
      </div>

      {/* 3. MIDDLE SECTION: Stream Distribution & Competency Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream Distribution */}
        <Card className="p-6 border-slate-200 dark:border-slate-800/80">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Stream-Wise Student Distribution</h3>
            <Badge variant="purple" size="sm">
              Academic Streams
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Student enrollment across statistical & computational streams</p>

          {streamDonutData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No learner data yet
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="w-48 h-48 shrink-0">
                <DonutChart data={streamDonutData} height={190} />
              </div>

              <div className="space-y-2 flex-1 w-full text-xs">
                {streamDonutData.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#181a29]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Competency Mastery & Skill Deficit Gaps */}
        <Card className="p-6 border-slate-200 dark:border-slate-800/80">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cohort Skill Deficits & Competencies</h3>
            <Badge variant="amber" size="sm">
              Gap Detection
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Average measured proficiency vs target mastery benchmark (85%)</p>

          {skillDist.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No competency data yet
            </div>
          ) : (
            <div className="space-y-3.5">
              {skillDist.map((item: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-200">{item.competency}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{item.averageScore}%</span>
                      {item.gap > 15 && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-bold">(-{item.gap}% Gap)</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.averageScore >= 75
                          ? "bg-purple-600"
                          : item.averageScore >= 60
                          ? "bg-blue-600"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${item.averageScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 4. BOTTOM SECTION: Performance Trends & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend Line Chart */}
        <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-slate-800/80">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cohort Progression Trends</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Benchmark score growth across structured evaluation sprints</p>
            </div>
            {trendChartData.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>Active</span>
              </div>
            )}
          </div>

          {trendChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No progression data available
            </div>
          ) : (
            <LineChart data={trendChartData} height={220} />
          )}
        </Card>

        {/* Talent Directory CTA Tile */}
        <Card className="p-6 bg-gradient-to-br from-purple-50/60 dark:from-purple-950/40 to-indigo-50/40 dark:to-indigo-950/20 border-purple-200 dark:border-purple-900/60 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Student Talent Discovery</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Connect with top performers based on verified test credentials, project portfolios, and validated statistical skills.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-purple-100 dark:border-purple-900/60">
            <Link href="/organization/students">
              <Button className="w-full bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold py-2.5 flex items-center justify-center gap-2">
                <span>Browse Student Profiles</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
