"use client";

import React from "react";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import { formatDateTime, AssignmentStatusBadge, NoLinkedLearner } from "@/components/parent/parentShared";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LineChart } from "@/components/charts/LineChart";
import { TrendingUp, LineChart as LineChartIcon } from "lucide-react";

export default function ParentProgressPage() {
  const { data } = useParentReport();
  if (!data?.report) return <NoLinkedLearner section="Learning progress" />;

  const { competencies, progress, assignments } = data.report;

  // Line chart of competency score progression (avg across competencies by history point)
  const historyByDate = new Map<string, { total: number; n: number }>();
  (competencies || []).forEach((c: any) => {
    (c.history || []).forEach((h: any) => {
      const key = h.recordedAt ? new Date(h.recordedAt).toLocaleDateString() : "";
      if (!key) return;
      const cur = historyByDate.get(key) || { total: 0, n: 0 };
      cur.total += h.score || 0;
      cur.n += 1;
      historyByDate.set(key, cur);
    });
  });
  const trendData = Array.from(historyByDate.entries())
    .map(([date, v]) => ({ name: date, score: Math.round(v.total / v.n) }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Learning Progress</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          How this learner is progressing across competencies and assigned work
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency progress */}
        <Card>
          <CardHeader
            title="Competency Progress"
            subtitle="Current score against target"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <div className="space-y-5">
            {(competencies || []).map((c: any) => (
              <div key={c._id?.toString() || c.competencyName}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.competencyName}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.currentScore}%</span>
                </div>
                <ProgressBar value={c.currentScore ?? 0} target={c.targetScore ?? 100} showLabel color="purple" size="sm" />
              </div>
            ))}
            {competencies.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No competency data yet.</p>
            )}
          </div>
        </Card>

        {/* Trend line */}
        <Card>
          <CardHeader
            title="Score Trend"
            subtitle="Average competency score over time"
            icon={<LineChartIcon className="w-5 h-5" />}
          />
          {trendData.length >= 2 ? (
            <div className="h-64">
              <LineChart data={trendData} />
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
              Not enough history to show a trend yet.
            </p>
          )}
        </Card>
      </div>

      {/* Progress events */}
      <Card>
        <CardHeader title="Progress Timeline" subtitle="Recorded learning events" icon={<TrendingUp className="w-5 h-5" />} />
        {progress.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No progress records yet.</p>
        ) : (
          <ol className="space-y-3">
            {progress.map((p: any) => (
              <li key={p._id?.toString()} className="flex items-center gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                    {String(p.metric || "").replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(p.recordedAt)}</p>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{p.value}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Assignments progress */}
      <Card>
        <CardHeader title="Assigned Work Progress" subtitle="Status of trainer-assigned tasks" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 pr-4 font-semibold">Task</th>
                <th className="py-3 pr-4 font-semibold">Type</th>
                <th className="py-3 pr-4 font-semibold">Assigned</th>
                <th className="py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.map((a: any) => (
                <tr key={a._id?.toString()}>
                  <td className="py-3 pr-4 font-medium text-slate-700 dark:text-slate-300">{a.content?.title}</td>
                  <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 capitalize">{a.content?.type?.replace("_", " ")}</td>
                  <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{formatDateTime(a.assignedAt)}</td>
                  <td className="py-3"><AssignmentStatusBadge status={a.status} /></td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-slate-500 dark:text-slate-400">No assigned work yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
