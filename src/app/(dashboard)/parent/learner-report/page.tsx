"use client";

import React from "react";
import Link from "next/link";
import { useParentReport } from "@/components/parent/ParentReportProvider";
import {
  formatDate,
  formatDateTime,
  initials,
  AssignmentStatusBadge,
  PassFailBadge,
  NoLinkedLearner,
} from "@/components/parent/parentShared";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GaugeChart } from "@/components/charts/DonutChart";
import {
  Award,
  FileCheck2,
  BrainCircuit,
  Layers,
  BookOpen,
  Clock,
  GraduationCap,
  UserCheck,
} from "lucide-react";

export default function ParentLearnerReportPage() {
  const { data } = useParentReport();
  if (!data?.report) return <NoLinkedLearner section="The learner report card" />;

  const { learner, trainers, summary, competencies, attempts, assignments, materials } = data.report;
  const trainer = trainers?.[0] || null;

  const overall = summary.overallCompetencyScore;
  const grade =
    overall >= 85 ? "Outstanding" : overall >= 70 ? "Good" : overall >= 50 ? "Developing" : "Needs Support";

  const attemptsList = attempts || [];
  const assessments = attemptsList.filter((a: any) => a.kind === "assessment");
  const quizzes = attemptsList.filter((a: any) => a.kind === "quiz");
  const streamTests = attemptsList.filter((a: any) => a.kind === "stream_test");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Learner Report Card</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          A complete read-only report card for {learner.name}
        </p>
      </div>

      {/* Score summary band */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <GaugeChart value={overall} label="Overall Score" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{learner.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {[learner.stream, learner.designation].filter(Boolean).join(" · ") || "Learner"}
              </p>
              <div className="mt-3">
                <Badge variant={overall >= 70 ? "emerald" : overall >= 50 ? "amber" : "red"} size="md">
                  Grade: {grade}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{assessments.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assessments</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{quizzes.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quizzes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{streamTests.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Stream Tests</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Learner details + trainer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Learner Details" icon={<GraduationCap className="w-5 h-5" />} />
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ["Email", learner.email],
              ["Stream", learner.stream],
              ["Designation", learner.designation],
              ["Department", learner.department],
              ["Education", learner.education],
              ["Career Goal", learner.careerGoal],
              ["Joined", formatDate(learner.joinedAt)],
            ].map(([k, v]) => (
              <div key={k as string} className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{k}</dt>
                <dd className="text-slate-700 dark:text-slate-300 font-medium">{v || "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Key Skills</div>
            <div className="flex flex-wrap gap-2">
              {(learner.existingSkills || []).map((s: string) => (
                <Badge key={s} variant="slate" size="sm">{s}</Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Connected Trainer"
            subtitle="Read-only trainer information"
            icon={<UserCheck className="w-5 h-5" />}
          />
          {trainer ? (
            <div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white text-xl font-black">
                  {initials(trainer.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{trainer.name}</h3>
                    <Badge variant="emerald">
                      <GraduationCap className="w-3 h-3" /> Connected
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{trainer.designation || "Trainer"}</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-1 gap-4 text-sm">
                {[
                  ["Department", trainer.department],
                  ["Education", trainer.education],
                  ["Email", trainer.email],
                ].map(([k, v]) => (
                  <div key={k as string} className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">{k}</dt>
                    <dd className="text-slate-700 dark:text-slate-300 font-medium">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No trainer is currently connected to this learner.
            </p>
          )}
        </Card>
      </div>

      {/* Assigned tasks / status */}
      <Card>
        <CardHeader
          title="Assigned Tasks & Status"
          subtitle="Materials, assessments and stream tests assigned by the trainer"
          icon={<BookOpen className="w-5 h-5" />}
          action={
            <Link href="/parent/materials" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              View materials
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 pr-4 font-semibold">Task</th>
                <th className="py-3 pr-4 font-semibold">Type</th>
                <th className="py-3 pr-4 font-semibold">Assigned</th>
                <th className="py-3 pr-4 font-semibold">Due</th>
                <th className="py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.map((a: any) => (
                <tr key={a._id?.toString()}>
                  <td className="py-3 pr-4 font-medium text-slate-700 dark:text-slate-300">{a.content?.title}</td>
                  <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 capitalize">{a.content?.type?.replace("_", " ")}</td>
                  <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{formatDate(a.assignedAt)}</td>
                  <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{formatDate(a.dueAt)}</td>
                  <td className="py-3"><AssignmentStatusBadge status={a.status} /></td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-slate-500 dark:text-slate-400">No tasks assigned yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Competency levels */}
      <Card>
        <CardHeader title="Competency Levels" subtitle="Current vs. target proficiency scores" icon={<Award className="w-5 h-5" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {competencies.map((c: any) => (
            <div key={c._id?.toString() || c.competencyName}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.competencyName}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.currentScore}%</span>
              </div>
              <ProgressBar value={c.currentScore ?? 0} target={c.targetScore ?? 100} showLabel color="purple" size="sm" />
            </div>
          ))}
          {competencies.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 col-span-2">No competency data yet.</p>
          )}
        </div>
      </Card>

      {/* Assessment results */}
      {assessments.length > 0 && (
        <Card>
          <CardHeader title="Assessment Results" subtitle="Completed assessments" icon={<FileCheck2 className="w-5 h-5" />} />
          <AssessmentTable rows={assessments} />
        </Card>
      )}
      {quizzes.length > 0 && (
        <Card>
          <CardHeader title="Quiz Results" subtitle="Completed quizzes" icon={<BrainCircuit className="w-5 h-5" />} />
          <AssessmentTable rows={quizzes} />
        </Card>
      )}
      {streamTests.length > 0 && (
        <Card>
          <CardHeader title="Stream Test Results" subtitle="Completed stream tests" icon={<Layers className="w-5 h-5" />} />
          <AssessmentTable rows={streamTests} />
        </Card>
      )}
      {attemptsList.length === 0 && (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400 py-8 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> No assessment activity yet.
        </Card>
      )}
    </div>
  );
}

function AssessmentTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <th className="py-3 pr-4 font-semibold">Assessment</th>
            <th className="py-3 pr-4 font-semibold">Date</th>
            <th className="py-3 pr-4 font-semibold">Score</th>
            <th className="py-3 pr-4 font-semibold">%</th>
            <th className="py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((a: any) => (
            <tr key={a._id}>
              <td className="py-3 pr-4 font-medium text-slate-700 dark:text-slate-300">{a.title}</td>
              <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{formatDateTime(a.completedAt || a.startedAt)}</td>
              <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{a.score}</td>
              <td className="py-3 pr-4 font-semibold text-slate-700 dark:text-slate-300">{a.percentage}%</td>
              <td className="py-3"><PassFailBadge passed={a.passed} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
