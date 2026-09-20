import { ObjectId } from "mongodb";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { Errors, ok, handleError } from "@/lib/apiResponse";
import {
  listLinkedLearnerIds,
  isLearnerLinkedToParent,
} from "@/db/parentLinks";
import { listAcceptedTrainerIds } from "@/db/connections";
import { getProfileByUserId } from "@/db/profiles";
import { findUserById } from "@/db/users";
import { getUserCompetenciesWithDetails } from "@/db/userCompetencies";
import { getAttemptsByUser } from "@/db/assessmentAttempts";
import { getAssessmentById } from "@/db/assessments";
import { listEnrichedAssignmentsForLearner } from "@/db/assignments";
import { getLearningMaterialById } from "@/db/learningMaterials";
import { getUserNotes } from "@/db/userNotes";
import { getProgressByUser } from "@/db/progress";
import { isValidObjectId } from "@/lib/sanitize";
import { Assessment } from "@/types";

/**
 * Parent / Guardian Portal — aggregate report for ONE linked learner.
 *
 * STRICTLY READ-ONLY. There are no mutation endpoints in the parent area.
 *
 * Authorization (server-side):
 *  - Session required (any parent of admin).
 *  - If ?learnerId= is supplied it MUST be an active link of the current
 *    parent, otherwise FORBIDDEN. This prevents changing an id in the URL to
 *    view another learner's report.
 *  - If no learnerId is given, the parent's first linked learner is used.
 *  - Parents never reach trainer/admin/learner routes because those enforce
 *    their own role guards; this route is the only data source for the portal.
 */

const KIND_LABEL: Record<string, string> = {
  assessment: "Assessment",
  quiz: "Quiz",
  stream_test: "Stream Test",
};

function assessmentKind(assessment?: Assessment | null): "assessment" | "quiz" | "stream_test" {
  if (assessment?.kind === "quiz") return "quiz";
  if (assessment?.kind === "stream_test") return "stream_test";
  return "assessment";
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["parent", "admin"]);

    const url = new URL(request.url);
    const requestedLearnerId = url.searchParams.get("learnerId");

    // All learners linked to this parent (used for the switcher + default).
    const linkedLearnerIds = await listLinkedLearnerIds(session.userId);

    // Resolve which learner to report on.
    if (requestedLearnerId) {
      if (!isValidObjectId(requestedLearnerId)) {
        throw Errors.notFound();
      }
      const linked = await isLearnerLinkedToParent(session.userId, requestedLearnerId);
      if (!linked) {
        throw Errors.forbidden();
      }
    }

    const learnerId: ObjectId | null =
      requestedLearnerId && isValidObjectId(requestedLearnerId)
        ? new ObjectId(requestedLearnerId)
        : linkedLearnerIds.length > 0
          ? linkedLearnerIds[0]!
          : null;

    // Parent identity.
    const parentProfile = await getProfileByUserId(session.userId);

    // Switcher list: linked learners with names.
    const list: { learnerId: string; learnerName: string }[] = [];
    for (const id of linkedLearnerIds) {
      const p = await getProfileByUserId(id);
      const u = await findUserById(id);
      list.push({
        learnerId: id.toHexString(),
        learnerName: p?.name || u?.email?.split("@")[0] || "Learner",
      });
    }

    if (!learnerId) {
      return ok({
        parent: { id: session.userId, name: parentProfile?.name },
        list,
        report: null,
        noLinkedLearners: true,
      });
    }

    const learnerUser = await findUserById(learnerId);
    if (!learnerUser) {
      throw Errors.notFound();
    }
    const learnerProfile = await getProfileByUserId(learnerId);

    // Connected trainers (accepted connections only, read-only).
    const acceptedTrainerIds = await listAcceptedTrainerIds(learnerId);
    const trainers: any[] = [];
    for (const tId of acceptedTrainerIds) {
      const tUser = await findUserById(tId);
      const tProfile = await getProfileByUserId(tId);
      trainers.push({
        id: tId.toHexString(),
        name: tProfile?.name || tUser?.email?.split("@")[0] || "Trainer",
        email: tUser?.email,
        designation: tProfile?.designation,
        department: tProfile?.department,
        education: tProfile?.education,
      });
    }

    const [competencies, attempts, assignments, notes, progress] = await Promise.all([
      getUserCompetenciesWithDetails(learnerId),
      getAttemptsByUser(learnerId),
      listEnrichedAssignmentsForLearner(learnerId),
      getUserNotes(learnerId),
      getProgressByUser(learnerId),
    ]);

    // Enrich attempts with assessment titles + kind + pass/fail status.
    const assessmentIds = Array.from(
      new Set(attempts.map((a: any) => a.assessmentId?.toString()).filter(Boolean))
    ).map((id) => new ObjectId(id as string));

    const assessments = (
      await Promise.all(assessmentIds.map((id) => getAssessmentById(id)))
    ).filter(Boolean) as Assessment[];

    const assessmentMap = new Map(
      assessments.map((a) => [a._id!.toHexString(), a])
    );

    const enrichedAttempts = attempts.map((a: any) => {
      const assessment = assessmentMap.get(a.assessmentId?.toString()) || null;
      const kind = assessmentKind(assessment);
      const percentage =
        a.percentage ?? a.evidence?.scorePercentage ?? (a.score || 0);
      const passingScore = assessment?.passingScore ?? 40;
      return {
        _id: a._id?.toString(),
        kind,
        kindLabel: KIND_LABEL[kind] || "Assessment",
        title: assessment?.title || "Assessment",
        competencyId: assessment?.competencyId?.toString(),
        stream: assessment?.stream,
        score: a.score,
        percentage: Math.round(percentage),
        passed: percentage >= passingScore,
        passingScore,
        completedAt: a.completedAt,
        startedAt: a.startedAt,
        evidence: a.evidence,
      };
    });

    // Assigned materials with read-only preview (metadata + truncated text).
    const materialAssignments = assignments.filter(
      (a) => a.content.type === "material" && a.content.refId
    );
    const materials: any[] = [];
    for (const ma of materialAssignments) {
      const material = await getLearningMaterialById(ma.content.refId!);
      if (!material) continue;
      materials.push({
        id: material._id!.toString(),
        fileName: material.fileName,
        preview:
          (material.extractedText || "").slice(0, 1200) ||
          "No text preview available for this document.",
        assignedAt: ma.assignedAt,
        status: ma.status,
      });
    }

    // Notes (learner's AI-tutor notes) — read-only.
    const readOnlyNotes = notes.map((n) => ({
      id: n._id?.toString(),
      title: n.title,
      topic: n.topic,
      summary: n.summary,
      keyPoints: n.keyPoints,
      updatedAt: n.updatedAt,
    }));

    // Summary metrics.
    const summary = {
      overallCompetencyScore:
        competencies.length > 0
          ? Math.round(
              competencies.reduce(
                (acc: number, c: any) => acc + (c.currentScore || 0),
                0
              ) / competencies.length
            )
          : 0,
      competencies: competencies.length,
      assessmentsCompleted: enrichedAttempts.filter((a) => a.kind === "assessment").length,
      quizzesCompleted: enrichedAttempts.filter((a) => a.kind === "quiz").length,
      streamTestsCompleted: enrichedAttempts.filter((a) => a.kind === "stream_test").length,
      assignmentsTotal: assignments.length,
      assignmentsNew: assignments.filter((a) => a.status === "new").length,
      assignmentsInProgress: assignments.filter((a) => a.status === "in_progress").length,
      assignmentsCompleted: assignments.filter((a) => a.status === "completed").length,
      materials: materials.length,
      notes: readOnlyNotes.length,
    };

    // Merged chronological activity timeline (read-only history).
    type TimelineEvent = {
      id: string;
      type: "assessment" | "quiz" | "stream_test" | "assignment" | "material" | "note" | "progress";
      label: string;
      title: string;
      date: string | Date | undefined;
      meta: Record<string, unknown>;
    };
    const timeline: TimelineEvent[] = [
      ...enrichedAttempts.map((a) => ({
        id: a._id || a.title,
        type: a.kind as TimelineEvent["type"],
        label: a.kindLabel,
        title: a.title,
        date: a.completedAt || a.startedAt,
        meta: { score: a.score, percentage: a.percentage, passed: a.passed },
      })),
      ...assignments.map((a) => ({
        id: a._id!.toHexString(),
        type: (a.content.type === "material" ? "material" : "assignment") as TimelineEvent["type"],
        label: a.content.type === "material" ? "Material assigned" : "Task assigned",
        title: a.content.title,
        date: a.assignedAt,
        meta: {
          status: a.status,
          contentType: a.content.type,
          trainerName: a.trainerName,
        },
      })),
      ...readOnlyNotes.map((n) => ({
        id: n.id || n.title,
        type: "note" as TimelineEvent["type"],
        label: "Note generated",
        title: n.title,
        date: n.updatedAt,
        meta: { topic: n.topic },
      })),
      ...progress.map((p) => ({
        id: `${p._id!.toHexString()}`,
        type: "progress" as TimelineEvent["type"],
        label: "Progress update",
        title: p.metric.replace(/_/g, " "),
        date: p.recordedAt,
        meta: { value: p.value },
      })),
    ]
      .filter((e) => e.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 40);

    return ok({
      parent: { id: session.userId, name: parentProfile?.name },
      list,
      report: {
        learner: {
          id: learnerId.toHexString(),
          name: learnerProfile?.name || "Learner",
          email: learnerUser.email,
          stream: learnerProfile?.stream,
          designation: learnerProfile?.designation,
          department: learnerProfile?.department,
          education: learnerProfile?.education,
          existingSkills: learnerProfile?.existingSkills || [],
          careerGoal: learnerProfile?.careerGoal,
          certifications: learnerProfile?.certifications || [],
          joinedAt: learnerUser.createdAt,
        },
        trainers,
        summary,
        competencies,
        attempts: enrichedAttempts,
        assignments,
        materials,
        notes: readOnlyNotes,
        progress,
        timeline,
      },
      noLinkedLearners: false,
    });
  } catch (error) {
    return handleError(error);
  }
}
