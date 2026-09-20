"use client";

import React from "react";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import { formatDate, NoLinkedLearner } from "@/components/parent/parentShared";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Award, TrendingDown, TrendingUp } from "lucide-react";

export default function ParentCompetenciesPage() {
  const { data } = useParentReport();
  if (!data?.report) return <NoLinkedLearner section="Competency levels" />;

  const { competencies } = data.report;

  const sorted = [...(competencies || [])].sort(
    (a: any, b: any) => (b.currentScore || 0) - (a.currentScore || 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Competency Report</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Proficiency levels for each tracked competency, with target scores and history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sorted.length === 0 && (
          <Card className="md:col-span-2 text-center text-sm text-slate-500 dark:text-slate-400 py-10">
            No competency data yet.
          </Card>
        )}
        {sorted.map((c: any) => {
          const history = (c.history || []).slice().sort(
            (a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
          );
          const first = history[0]?.score;
          const last = history[history.length - 1]?.score;
          const improving = typeof first === "number" && typeof last === "number" && last >= first;
          return (
            <Card key={c._id?.toString() || c.competencyName}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{c.competencyName}</h3>
                  {c.category && <Badge variant="slate" size="sm" className="mt-1">{c.category}</Badge>}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{c.currentScore}%</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Target {c.targetScore}%</div>
                </div>
              </div>
              <ProgressBar value={c.currentScore ?? 0} target={c.targetScore ?? 100} showLabel color="purple" size="md" />
              <div className="mt-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                {typeof first === "number" ? (
                  <>
                    <span className={`inline-flex items-center gap-1 font-medium ${improving ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {improving ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {last}% latest
                    </span>
                    <span>·</span>
                    <span>{history.length} record{history.length > 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>First assessed {formatDate(history[0]?.recordedAt)}</span>
                  </>
                ) : (
                  <span>No history recorded yet.</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {sorted.length > 0 && (
        <Card>
          <CardHeader title="Competency History" subtitle="Chronological score records per competency" icon={<Award className="w-5 h-5" />} />
          <div className="space-y-5">
            {sorted.map((c: any) => (
              <div key={`hist-${c._id?.toString() || c.competencyName}`}>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{c.competencyName}</p>
                {c.history?.length ? (
                  <div className="flex items-end gap-3">
                    {(c.history || [])
                      .slice()
                      .sort((a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                      .map((h: any, idx: number) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{h.score}%</span>
                          <div
                            className="w-8 rounded-t-md bg-gradient-to-t from-purple-700 to-purple-400"
                            style={{ height: `${Math.max(6, (h.score / (c.targetScore || 100)) * 80)}px` }}
                          />
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(h.recordedAt)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No history.</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
