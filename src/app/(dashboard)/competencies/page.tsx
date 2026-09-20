"tsx"
"use client";

import React, { useEffect, useState } from "react";
import { competenciesApi, analyticsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { RadarChart } from "@/components/charts/RadarChart";
import { Button } from "@/components/ui/Button";
import { Search, Award, CheckCircle2, AlertCircle, FileCheck2 } from "lucide-react";
import Link from "next/link";

export default function CompetenciesPage() {
  const [loading, setLoading] = useState(true);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [compRes, analyticsRes] = await Promise.all([
          competenciesApi.list(),
          analyticsApi.getLearner(),
        ]);

        if (compRes.success && compRes.data) {
          setCompetencies(compRes.data as any[]);
        }
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.error("Failed to load competencies", err);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const userComps = (analytics?.competencies?.all as any[]) || [];
  const compMap = new Map<string, any>(userComps.map((c: any) => [c.competencyId, c]));
  const totalAssessments = analytics?.summary?.totalAssessmentsTaken ?? 0;
  const isAssessed = userComps.length > 0 || totalAssessments > 0;

  const enrichedCompetencies = competencies.map((c: any) => {
    const userComp: any = compMap.get(c._id);
    const currentScore = userComp?.currentScore ?? 0;
    const targetScore = userComp?.targetScore ?? 85;
    const gap = isAssessed ? Math.max(0, targetScore - currentScore) : 0;

    return {
      _id: c._id,
      name: c.name,
      category: c.category || "General Statistics",
      currentScore,
      targetScore,
      gap,
      status: !isAssessed
        ? "Unassessed"
        : currentScore >= 75
        ? "Strong"
        : currentScore >= 60
        ? "Proficient"
        : "Needs Focus",
    };
  });

  const filtered = enrichedCompetencies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const radarData = isAssessed
    ? enrichedCompetencies.slice(0, 6).map((c) => ({
        competency: c.name.length > 15 ? c.name.slice(0, 13) + ".." : c.name,
        current: c.currentScore,
        target: c.targetScore,
      }))
    : [];

  const strongAreas = isAssessed ? enrichedCompetencies.filter((c) => c.currentScore >= 75) : [];
  const growthAreas = isAssessed ? enrichedCompetencies.filter((c) => c.gap > 20) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Competency Framework
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Statistical Competency Standards & User Progress
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search competencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
          />
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Comparison */}
        <Card className="lg:col-span-1 p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Competency Radar</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Current capability benchmarked against standard targets
          </p>
          {isAssessed && radarData.length > 0 ? (
            <RadarChart data={radarData} height={240} />
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Award className="w-8 h-8 text-purple-400 dark:text-purple-500 mb-2 opacity-60" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Assessment Data</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Complete your first diagnostic assessment to see your competency profile.
              </p>
            </div>
          )}
        </Card>

        {/* Strong Areas */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Mastered Areas (Score &ge; 75%)
            </h3>
          </div>
          {strongAreas.length > 0 ? (
            <div className="space-y-3">
              {strongAreas.map((c) => (
                <div
                  key={c._id}
                  className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{c.name}</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{c.currentScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{c.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isAssessed
                  ? "No competencies currently above 75%."
                  : "Complete an assessment to identify your mastered areas."}
              </p>
            </div>
          )}
        </Card>

        {/* Growth Areas */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Priority Growth Gaps
            </h3>
          </div>
          {growthAreas.length > 0 ? (
            <div className="space-y-3">
              {growthAreas.map((c) => (
                <div
                  key={c._id}
                  className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50 flex justify-between items-center"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold mt-0.5">
                      Gap: {c.gap}% Deficit
                    </p>
                  </div>
                  <Link
                    href="/gap-analysis"
                    className="text-xs font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                  >
                    Fix &gt;
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isAssessed
                  ? "No critical competency deficits detected."
                  : "No competency gaps identified yet."}
              </p>
              {!isAssessed && (
                <Link href="/assessments">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl mt-2">
                    Take Assessment
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Full Competency List */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          All Competency Standards
        </h3>
        <div className="space-y-4">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-purple-200 dark:hover:border-purple-800/60 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 sm:max-w-md w-full">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{c.name}</h4>
                  <Badge
                    variant={
                      c.status === "Strong"
                        ? "emerald"
                        : c.status === "Proficient"
                        ? "purple"
                        : c.status === "Needs Focus"
                        ? "amber"
                        : "slate"
                    }
                    size="sm"
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{c.category}</p>
              </div>

              <div className="flex-1 max-w-xs w-full">
                <ProgressBar
                  value={c.currentScore}
                  target={isAssessed ? c.targetScore : undefined}
                  showLabel={isAssessed}
                  color={c.currentScore >= 75 ? "purple" : "blue"}
                  size="sm"
                />
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAssessed ? `Gap: ${c.gap}%` : "Unassessed"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
