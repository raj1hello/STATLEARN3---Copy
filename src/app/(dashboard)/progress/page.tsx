"tsx"
"use client";

import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { LineChart } from "@/components/charts/LineChart";
import { TrendingUp, Award, FileCheck2, ArrowUpRight, BarChart2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await analyticsApi.getLearner();
        if (res.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error("Failed to load progress data", err);
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

  const summary = analytics?.summary || {};
  const improvementAssessments = analytics?.improvementTracking?.assessments || [];
  const totalAssessments = summary.totalAssessmentsTaken ?? 0;
  const isAssessed = totalAssessments > 0;

  const pointsGained = summary.overallImprovementPoints ?? 0;
  const avgScore = summary.averageAssessmentScore ?? 0;
  const activePaths = summary.activeLearningPaths ?? 0;

  const trendData = isAssessed
    ? [
        { name: "Diagnostic", score: Math.max(0, avgScore - pointsGained) },
        { name: "Current", score: avgScore },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Progress & Growth Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Measurable Competency Gains & Before/After Reassessment Metrics
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overall Points Gained</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {pointsGained > 0 ? `+${pointsGained}` : "0"} pts
                </span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-3 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />{" "}
            {pointsGained > 0 ? "Quantifiable capability improvement" : "No reassessment points yet"}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Assessment Score</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {avgScore}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mt-3">
            {isAssessed ? "Across completed assessments" : "No assessments completed"}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Learning Paths</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {activePaths}
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-3">
            {activePaths > 0 ? "Targeted sprint in progress" : "No active path configured"}
          </p>
        </Card>
      </div>

      {/* Main Historical Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Historical Competency Trajectory</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Progression across weekly milestones and evaluations</p>
          </div>
          {isAssessed && (
            <Badge variant="emerald" size="sm">
              Positive Gain
            </Badge>
          )}
        </div>
        {isAssessed && trendData.length > 0 ? (
          <LineChart data={trendData} height={260} />
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <BarChart2 className="w-8 h-8 text-purple-400 dark:text-purple-500 mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Historical Score Trend Yet</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              Complete diagnostic assessments and learning modules to build your growth curve.
            </p>
            <Link href="/assessments" className="mt-3">
              <Button size="sm" variant="outline" className="text-xs rounded-xl">
                Take Diagnostic Assessment
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Before vs After Assessment Improvement Breakdown */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Before vs After Reassessment Growth
        </h3>

        {improvementAssessments.length > 0 ? (
          <div className="space-y-4">
            {improvementAssessments.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#181a29] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Assessment ID: {item.assessmentId?.slice(-6) || "ASSESS"}
                  </p>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Total Attempts: {item.totalAttempts}
                  </h4>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Initial Score</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{item.beforeScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Latest Score</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.afterScore}%</span>
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-300 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                    +{item.rawImprovement}% ({item.percentageGain}% Gain)
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Reassessments Recorded</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
              After completing learning paths and retaking assessments, your comparative before/after growth delta will appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
