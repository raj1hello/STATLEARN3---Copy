"use client";

import React from "react";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import { formatDateTime, PassFailBadge, NoLinkedLearner } from "@/components/parent/parentShared";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Layers } from "lucide-react";

export default function ParentStreamTestsPage() {
  const { data } = useParentReport();
  if (!data?.report) return <NoLinkedLearner section="Stream test results" />;

  const { attempts, assignments } = data.report;
  const streamTests = (attempts || []).filter((a: any) => a.kind === "stream_test");
  const assignedStreamTests = (assignments || []).filter((a: any) => a.content?.type === "stream_test");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Stream Tests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Stream-based testing performance and assigned stream tests
        </p>
      </div>

      <Card>
        <CardHeader
          title="Stream Test Results"
          subtitle="Completed stream tests with scores"
          icon={<Layers className="w-5 h-5" />}
        />
        {streamTests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No stream tests completed yet.
          </p>
        ) : (
          <div className="space-y-4">
            {streamTests.map((a: any) => (
              <div
                key={a._id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDateTime(a.completedAt || a.startedAt)}
                  </p>
                  {a.stream && <Badge variant="blue" size="sm" className="mt-1.5">{a.stream}</Badge>}
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{a.percentage}%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Score {a.score} · Passing {a.passingScore}%
                    </div>
                  </div>
                  <div className="w-24 flex justify-end"><PassFailBadge passed={a.passed} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Assigned Stream Tests" subtitle="Stream tests assigned by the trainer" icon={<Layers className="w-5 h-5" />} />
        {assignedStreamTests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            No stream tests assigned yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {assignedStreamTests.map((a: any) => (
              <li key={a._id?.toString()} className="py-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{a.content?.title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(a.assignedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
