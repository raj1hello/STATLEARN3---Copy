"tsx"
"use client";

import React, { useEffect, useState } from "react";
import { recommendationsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { BookOpen, Sparkles, Star, Clock, ArrowRight, FileCheck2, Compass } from "lucide-react";
import Link from "next/link";

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await recommendationsApi.get();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load recommendations", err);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const recs = data?.recommendations || [];
  const hasRecs = recs.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            AI Course Recommendations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explainable Course Suggestions Aligned to Close Your Specific Deficits
          </p>
        </div>

        <Link href="/learning-path">
          <Button className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold">
            <span>View 4-Week Learning Path</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Grid of Recommended Courses */}
      {hasRecs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recs.map((rec: any, idx: number) => (
            <Card
              key={idx}
              className="p-6 flex flex-col justify-between hover:border-purple-200 dark:hover:border-purple-800/60 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={rec.priority === "high" ? "red" : "purple"} size="sm">
                    {rec.priority?.toUpperCase()} PRIORITY
                  </Badge>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>4.8</span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-2xl w-fit text-purple-700 dark:text-purple-300 mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {rec.courseTitle}
                </h3>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mt-1">
                  Target: {rec.competencyName}
                </p>

                {/* Explainable Rationale */}
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-[#181a29] rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Why Recommended</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rec.reason}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 3-4 Weeks
                </div>

                <Link href="/learning-path">
                  <Button
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
                  >
                    <span>Start Module</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Course Recommendations Available</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
            Recommendations are dynamically synthesized after you take assessments to identify target skills that require remediation.
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
  );
}
