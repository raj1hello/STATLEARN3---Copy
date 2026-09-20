"use client";

import React, { useState } from "react";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import { formatDateTime, PassFailBadge, AssignmentStatusBadge, NoLinkedLearner } from "@/components/parent/parentShared";
import { Card } from "@/components/ui/Card";
import {
  FileCheck2,
  BrainCircuit,
  Layers,
  FileText,
  StickyNote,
  TrendingUp,
} from "lucide-react";

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  assessment: { label: "Assessment", color: "bg-purple-500", icon: FileCheck2 },
  quiz: { label: "Quiz", color: "bg-amber-500", icon: BrainCircuit },
  stream_test: { label: "Stream Test", color: "bg-emerald-500", icon: Layers },
  material: { label: "Material", color: "bg-blue-500", icon: FileText },
  assignment: { label: "Assignment", color: "bg-indigo-500", icon: FileText },
  note: { label: "Note", color: "bg-amber-500", icon: StickyNote },
  progress: { label: "Progress", color: "bg-slate-400", icon: TrendingUp },
};

export default function ParentHistoryPage() {
  const { data } = useParentReport();
  const [filter, setFilter] = useState<string>("all");

  if (!data?.report) return <NoLinkedLearner section="Activity and performance history" />;

  const { timeline } = data.report;
  const rows = filter === "all" ? timeline : (timeline || []).filter((e: any) => e.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Activity &amp; Performance History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          A chronological account of this learner&apos;s educational activity
        </p>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All activity" },
          { key: "assessment", label: "Assessments" },
          { key: "quiz", label: "Quizzes" },
          { key: "stream_test", label: "Stream Tests" },
          { key: "material", label: "Materials" },
          { key: "note", label: "Notes" },
          { key: "progress", label: "Progress" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === f.key
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">
          No activity in this category yet.
        </Card>
      ) : (
        <Card>
          <ol className="relative space-y-5" >
            {rows.map((e: any, idx: number) => {
              const meta = (TYPE_META[e.type] || TYPE_META.assignment)!;
              const Icon = meta.icon;
              return (
                <li key={`${e.id}-${idx}`} className="relative pl-9">
                  {/* line */}
                  {idx < rows.length - 1 && (
                    <span className="absolute left-[13px] top-6 bottom-[-22px] w-px bg-slate-200 dark:bg-slate-800" />
                  )}
                  <span className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center text-white ${meta.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{e.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateTime(e.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {typeof e.meta?.score !== "undefined" && (
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Score {e.meta.score}
                          {typeof e.meta.percentage === "number" ? ` (${e.meta.percentage}%)` : ""}
                        </span>
                      )}
                      {typeof e.meta?.passed === "boolean" && <PassFailBadge passed={e.meta.passed} />}
                      {e.meta?.status && <AssignmentStatusBadge status={e.meta.status} />}
                      {typeof e.meta?.value !== "undefined" && (
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{e.meta.value}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500 mt-1">{meta.label}</p>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {rows.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Showing {rows.length} of {timeline?.length || 0} activity events
        </p>
      )}
    </div>
  );
}
