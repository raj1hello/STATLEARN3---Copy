"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Users, UserPlus } from "lucide-react";
import { useParentReport } from "@/components/parent/ParentReportProvider";

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssignmentStatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge variant="emerald">Completed</Badge>;
  if (status === "in_progress") return <Badge variant="blue">In Progress</Badge>;
  return <Badge variant="amber">New</Badge>;
}

export function PassFailBadge({ passed }: { passed: boolean }) {
  return passed ? <Badge variant="emerald">Passed</Badge> : <Badge variant="red">Needs Improvement</Badge>;
}

export function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {icon && (
        <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white shadow-md shadow-purple-600/20">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] || "";
  const last = parts[parts.length - 1] || "";
  if (parts.length === 1) return first.slice(0, 1).toUpperCase();
  return (first.slice(0, 1) + last.slice(0, 1)).toUpperCase();
}

/**
 * Empty state shown on any Parent Portal page when the account is not linked to
 * a learner yet. Navigation stays fully available; this replaces the content
 * section so the parent always knows why the section is empty and how to fix it.
 */
export function NoLinkedLearner({ section }: { section?: string }) {
  const { openLinkLearner } = useParentReport();
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
        No linked learner yet
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {section || "This section"} shows a learner&apos;s data. Link your child&apos;s or
        ward&apos;s account by their email to view it here. The learner must confirm
        the request from their account.
      </p>
      <button
        type="button"
        onClick={openLinkLearner}
        className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        Link Learner
      </button>
    </Card>
  );
}
