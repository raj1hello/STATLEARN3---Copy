"use client";

import React, { useState } from "react";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import { formatDateTime, PassFailBadge, NoLinkedLearner } from "@/components/parent/parentShared";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileCheck2, BrainCircuit } from "lucide-react";

export default function ParentAssessmentsPage() {
  const { data } = useParentReport();
  const [tab, setTab] = useState<"assessment" | "quiz">("assessment");

  if (!data?.report) return <NoLinkedLearner section="Assessment and quiz results" />;

  const { attempts, competencies } = data.report;
  const competencyMap = new Map<string, string>(
    (competencies || []).map((c: any) => [String(c.competencyId ?? ""), c.competencyName])
  );

  const assessments = (attempts || []).filter((a: any) => a.kind === "assessment");
  const quizzes = (attempts || []).filter((a: any) => a.kind === "quiz");
  const rows = tab === "assessment" ? assessments : quizzes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assessments &amp; Quizzes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Scores, dates and outcomes for every assessment and quiz this learner has completed
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#11131f] p-1">
        <button
          type="button"
          onClick={() => setTab("assessment")}
          aria-pressed={tab === "assessment"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            tab === "assessment"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Assessments ({assessments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("quiz")}
          aria-pressed={tab === "quiz"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            tab === "quiz"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <BrainCircuit className="w-4 h-4" /> Quizzes ({quizzes.length})
        </button>
      </div>

      <Card>
        <CardHeader
          title={tab === "assessment" ? "Assessment Report" : "Quiz Report"}
          subtitle="Name · Date · Score · Status · Competency"
        />
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No {tab === "assessment" ? "assessments" : "quizzes"} completed yet.
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((a: any) => (
              <div
                key={a._id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDateTime(a.completedAt || a.startedAt)}
                    {a.stream ? ` · ${a.stream}` : ""}
                  </p>
                  {competencyMap.get(a.competencyId) && (
                    <Badge variant="slate" size="sm" className="mt-1.5">{competencyMap.get(a.competencyId)}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{a.percentage}%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Score {a.score}</div>
                  </div>
                  <div className="w-24 flex justify-end"><PassFailBadge passed={a.passed} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
