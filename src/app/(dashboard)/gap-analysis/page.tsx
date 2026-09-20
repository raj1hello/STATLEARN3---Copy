"tsx"
"use client";

import React, { useEffect, useState } from "react";
import { gapAnalysisApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { ArrowRight, Sparkles, BookOpen, GitFork, ShieldCheck, FileCheck2 } from "lucide-react";
import Link from "next/link";

export default function GapAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [gapData, setGapData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await gapAnalysisApi.get();
        if (res.success && res.data) {
          setGapData(res.data);
        }
      } catch (err) {
        console.error("Failed to load gap analysis", err);
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
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const overallGap = gapData?.overallGapIndex ?? 0;
  const gaps = gapData?.competencies || [];
  const hasGaps = gaps.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Evidence-Based Gap Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            AI-Engineered Diagnostic Pinpointing Specific Conceptual Misconceptions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/recommendations">
            <Button className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Recommended Courses</span>
            </Button>
          </Link>
          <Link href="/learning-path">
            <Button variant="outline" className="rounded-xl text-xs font-semibold">
              <GitFork className="w-3.5 h-3.5" />
              <span>4-Week Roadmap</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Banner */}
      <Card className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-purple-300">
              Aggregated Deficiency Index
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl font-black text-white">{overallGap}%</span>
              <span className="text-xs text-purple-200">
                {hasGaps ? "Total average gap across evaluated competencies" : "No active gap detected"}
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-2 max-w-xl">
              Our AI analyzes every question attempt and underlying error pattern to formulate targeted remediation recommendations.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 p-4 rounded-2xl border border-white/10 text-center">
            <span className="text-2xl font-bold text-white">{gaps.length}</span>
            <p className="text-[11px] text-purple-200 mt-0.5">Competencies Analyzed</p>
          </div>
        </div>
      </Card>

      {/* Detailed Gap Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Identified Competency Deficits</h3>

        {hasGaps ? (
          gaps.map((gap: any, idx: number) => {
            const isHigh = gap.severity === "high";
            return (
              <Card
                key={idx}
                className="p-6 border-slate-200 dark:border-slate-800/80 hover:border-purple-200 dark:hover:border-purple-800/60 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={isHigh ? "red" : gap.severity === "medium" ? "amber" : "blue"} size="sm">
                        {gap.severity?.toUpperCase()} PRIORITY
                      </Badge>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        Score Gap: {gap.gap}%
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{gap.competencyName}</h4>

                    {/* AI Explanation of Error Evidence */}
                    <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-100/70 dark:border-purple-900/50">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Diagnostic Assessment & Evidence</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{gap.explanation}</p>
                    </div>
                  </div>

                  {/* Progress Indicators & Action */}
                  <div className="w-full md:w-64 space-y-4 shrink-0">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Current: {gap.currentScore}%</span>
                        <span>Target: {gap.targetScore}%</span>
                      </div>
                      <ProgressBar
                        value={gap.currentScore}
                        target={gap.targetScore}
                        color={isHigh ? "amber" : "purple"}
                        size="sm"
                      />
                    </div>

                    <Link href="/learning-path">
                      <Button
                        size="sm"
                        className="w-full bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold py-2"
                      >
                        <span>Take Action in Roadmap</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Skill Gaps Detected</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Complete an initial diagnostic assessment to let our AI identify your priority growth areas and misconception patterns.
            </p>
            <div className="pt-2">
              <Link href="/assessments">
                <Button size="sm" variant="outline" className="text-xs rounded-xl">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Take Diagnostic Assessment</span>
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
