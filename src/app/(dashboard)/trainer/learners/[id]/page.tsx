"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trainerLearnersApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { AssignContentModal } from "@/components/trainer/AssignContentModal";
import {
  User,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Target,
  Award,
  BookOpen,
  FileCheck2,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function ConnectedLearnerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!learnerId) return;
    loadLearnerData();
  }, [learnerId]);

  const loadLearnerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await trainerLearnersApi.get(learnerId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || "Failed to load learner profile");
      }
    } catch {
      setError("An unexpected error occurred while loading profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/trainer/learners">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Learners</span>
          </Button>
        </Link>
        <Card className="p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500/80 mx-auto" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {error || "Learner Profile Unavailable"}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You can only inspect profiles of learners who have an active, accepted connection with you.
          </p>
        </Card>
      </div>
    );
  }

  const {
    name,
    email,
    stream,
    designation,
    department,
    education,
    experience,
    careerGoal,
    existingSkills,
    certifications,
    projects,
    competencies,
    recentAttempts,
    assignments,
  } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/trainer/learners">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Learners</span>
          </Button>
        </Link>

        <Button
          onClick={() => setAssignModalOpen(true)}
          className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-5 py-2.5 flex items-center gap-2 shadow-md shadow-purple-900/20"
        >
          <Send className="w-4 h-4" />
          <span>Assign Content to {name.split(" ")[0]}</span>
        </Button>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HERO PROFILE CARD */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20 dark:from-[#11131f] dark:via-purple-950/10 dark:to-indigo-950/10 border-purple-100 dark:border-purple-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-purple-600/30 shrink-0">
            {name.charAt(0)?.toUpperCase() || "L"}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {name}
              </h1>
              <Badge variant="emerald" size="sm" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connected Learner</span>
              </Badge>
              {stream && (
                <Badge variant="purple" size="sm" className="capitalize">
                  {stream} Stream
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{email}</p>

            <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
              {designation && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{designation}</span>
                </span>
              )}
              {department && (
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{department}</span>
                </span>
              )}
              {education && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>{education}</span>
                </span>
              )}
              {experience !== undefined && experience > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{experience} years exp</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {careerGoal && (
          <div className="mt-6 p-4 rounded-2xl bg-white/80 dark:bg-black/20 border border-purple-100 dark:border-purple-900/40 text-xs flex items-start gap-2.5">
            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Career Goal: </span>
              <span className="text-slate-600 dark:text-slate-400">{careerGoal}</span>
            </div>
          </div>
        )}
      </Card>

      {/* 2. SKILLS & COMPETENCIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Card */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Declared Skills & Competencies</span>
          </h3>

          {existingSkills && existingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {existingSkills.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-900/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No declared skills listed.</p>
          )}

          {certifications && certifications.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Certifications
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {certifications.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Evaluated Competency Scores */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Evaluated Competency Benchmarks</span>
          </h3>

          {competencies && competencies.length > 0 ? (
            <div className="space-y-3">
              {competencies.map((comp: any) => (
                <div key={comp._id || comp.competencyId} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {comp.competencyName || comp.name || "Competency"}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {comp.currentScore}% / {comp.targetScore}%
                    </span>
                  </div>
                  <ProgressBar
                    value={comp.currentScore}
                    target={comp.targetScore}
                    size="sm"
                    color={comp.currentScore >= 70 ? "emerald" : "purple"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No diagnostic assessments scored yet. Assign an assessment to evaluate competencies!
            </div>
          )}
        </Card>
      </div>

      {/* 3. ASSIGNED CONTENT FROM THIS TRAINER */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Assigned Content History</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasks and evaluations you have assigned to this learner
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setAssignModalOpen(true)}
            className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold"
          >
            + Assign More
          </Button>
        </div>

        {assignments && assignments.length > 0 ? (
          <div className="space-y-2.5">
            {assignments.map((item: any) => {
              const statusVariant =
                item.status === "completed"
                  ? "emerald"
                  : item.status === "in_progress"
                  ? "blue"
                  : "amber";

              return (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple" size="sm" className="capitalize">
                        {item.content?.type?.replace("_", " ")}
                      </Badge>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.content?.title}
                      </h4>
                      <Badge variant={statusVariant} size="sm" className="capitalize">
                        {item.status.replace("_", " ")}
                      </Badge>
                    </div>

                    {item.message && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        &quot;{item.message}&quot;
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      <span>Assigned: {new Date(item.assignedAt).toLocaleDateString()}</span>
                      {item.dueAt && (
                        <span>Due: {new Date(item.dueAt).toLocaleDateString()}</span>
                      )}
                      {item.completedAt && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Completed: {new Date(item.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            You have not assigned any tasks or tests to this learner yet.
          </div>
        )}
      </Card>

      {/* 4. RECENT ASSESSMENT ATTEMPTS */}
      {recentAttempts && recentAttempts.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Recent Assessment Attempts</span>
          </h3>

          <div className="space-y-2">
            {recentAttempts.map((att: any) => (
              <div
                key={att._id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Diagnostic Evaluation
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Completed: {new Date(att.completedAt || att.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-purple-700 dark:text-purple-400">
                    {att.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Unified Assign Content Modal preselected with this learner */}
      <AssignContentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => {
          setToastMessage("Content successfully assigned to learner!");
          loadLearnerData();
          setTimeout(() => setToastMessage(null), 3000);
        }}
        preselectedLearner={{ id: learnerId, name }}
      />
    </div>
  );
}
