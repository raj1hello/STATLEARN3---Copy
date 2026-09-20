"use client";

import React, { useState } from "react";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import { formatDate, AssignmentStatusBadge, NoLinkedLearner } from "@/components/parent/parentShared";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText, StickyNote } from "lucide-react";

export default function ParentMaterialsPage() {
  const { data } = useParentReport();
  const [openMaterial, setOpenMaterial] = useState<string | null>(null);

  if (!data?.report) return <NoLinkedLearner section="Assigned materials and notes" />;

  const { materials, notes } = data.report;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Assigned Materials</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Learning materials and notes assigned to this learner — read-only previews
        </p>
      </div>

      {/* Materials */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Learning Materials</h2>
          </div>
          <Badge variant="slate">{materials.length} assigned</Badge>
        </div>
        {materials.length === 0 ? (
          <Card className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
            No learning materials assigned yet.
          </Card>
        ) : (
          <div className="space-y-4">
            {materials.map((m: any) => (
              <Card key={m.id} className={openMaterial === m.id ? "ring-2 ring-purple-500/40" : undefined}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{m.fileName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Assigned {formatDate(m.assignedAt)} · <AssignmentStatusBadge status={m.status} />
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenMaterial(openMaterial === m.id ? null : m.id)}
                    aria-expanded={openMaterial === m.id}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline shrink-0 cursor-pointer"
                  >
                    {openMaterial === m.id ? "Hide preview" : "Read preview"}
                  </button>
                </div>
                {openMaterial === m.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-[12]">
                      {m.preview}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Preview showing start of document only.
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Notes (view-only) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Notes &amp; Summaries</h2>
          </div>
          <Badge variant="slate">{notes.length} saved</Badge>
        </div>
        {notes.length === 0 ? (
          <Card className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
            No notes generated yet.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((n: any) => (
              <Card key={n.id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{n.title}</h3>
                  {n.topic && <Badge variant="amber" size="sm">{n.topic}</Badge>}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">{n.summary}</p>
                {n.keyPoints?.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {n.keyPoints.slice(0, 3).map((k: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex gap-1.5">
                        <span className="text-amber-500">•</span> {k}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Updated {formatDate(n.updatedAt)}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
