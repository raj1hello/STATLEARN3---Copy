"use client";

import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { FileCheck2 } from "lucide-react";

export default function AdminAssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await analyticsApi.getAdmin();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load", err);
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
      </div>
    );
  }

  const perf = data?.assessmentPerformance || {};
  const recent = data?.recentAttempts || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Assessments & Performance</span>
            <Badge variant="emerald" size="sm">
              Global Data
            </Badge>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Attempts Completed</p>
          <div className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-100">{perf.totalAttemptsCompleted}</div>
        </Card>
        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Average Global Score</p>
          <div className="text-3xl font-black mt-1 text-slate-900 dark:text-slate-100">{perf.averageAssessmentScore}%</div>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-purple-600" /> Recent Assessment Activity
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3">Learner</th>
                <th className="px-5 py-3 text-right">Score</th>
                <th className="px-5 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {recent.map((a: any) => (
                <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium">{a.userName}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-700 dark:text-slate-300">{a.score}%</td>
                  <td className="px-5 py-3 text-right text-slate-500 text-xs">{new Date(a.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
