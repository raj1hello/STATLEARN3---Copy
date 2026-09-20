import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { getAssessmentById, updateAssessment, deleteAssessment } from "@/db/assessments";
import { getQuestionsByAssessment, deleteQuestionsByAssessment } from "@/db/questions";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput, toObjectId } from "@/lib/sanitize";

const PatchAssessmentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  type: z.enum(["mcq", "scenario"]).optional(),
  competencyId: z.string().optional(),
  published: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid assessment ID format", 400);
    }

    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return fail("NOT_FOUND", "Assessment not found", 404);
    }

    // If learner, ensure the assessment is published AND either official, created by this learner, or assigned by a trainer
    if (session.role === "learner") {
      if (!assessment.published) {
        return fail("FORBIDDEN", "This assessment is not available yet", 403);
      }
      const isOwner = assessment.createdById?.toHexString() === session.userId;
      const isOfficial = Boolean(assessment.isOfficial);
      
      const { assignmentsCol } = await import("@/db/collections");
      const aCol = await assignmentsCol();
      const assignment = await aCol.findOne({
        learnerId: toObjectId(session.userId),
        "content.refId": toObjectId(id),
      });
      const isAssigned = assignment !== null;

      if (!isOwner && !isOfficial && !isAssigned) {
        return fail("FORBIDDEN", "You do not have permission to access this assessment", 403);
      }

      // If assigned and status is new, mark as in_progress
      if (isAssigned && assignment?.status === "new") {
        const { markAssignmentAttempt } = await import("@/db/assignments");
        await markAssignmentAttempt(session.userId, id, "in_progress");
      }
    }

    const questions = await getQuestionsByAssessment(id);

    // CRITICAL SECURITY RULE: Never expose correct answers or explanations to learners before submission!
    if (session.role === "learner") {
      const sanitizedQuestions = questions.map((q) => ({
        _id: q._id,
        assessmentId: q.assessmentId,
        competencyId: q.competencyId,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        answers: q.answers.map((a) => ({
          text: a.text,
          // Omitting isCorrect and explanation
        })),
      }));

      return ok({
        ...assessment,
        questions: sanitizedQuestions,
      });
    }

    // Trainers and admins get full questions with answers for review/editing
    return ok({
      ...assessment,
      questions,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid assessment ID format", 400);
    }

    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return fail("NOT_FOUND", "Assessment not found", 404);
    }

    // Check ownership if trainer
    if (session.role === "trainer" && assessment.createdById.toHexString() !== session.userId) {
      return fail("FORBIDDEN", "You can only edit your own assessments", 403);
    }

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = PatchAssessmentSchema.parse(cleanBody);

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.type !== undefined) updateData.type = parsed.type;
    if (parsed.published !== undefined) updateData.published = parsed.published;
    if (parsed.competencyId !== undefined) {
      updateData.competencyId = toObjectId(parsed.competencyId);
    }

    const updated = await updateAssessment(id, updateData);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid assessment ID format", 400);
    }

    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return fail("NOT_FOUND", "Assessment not found", 404);
    }

    if (session.role === "trainer" && assessment.createdById.toHexString() !== session.userId) {
      return fail("FORBIDDEN", "You can only delete your own assessments", 403);
    }

    await deleteQuestionsByAssessment(id);
    const deleted = await deleteAssessment(id);
    return ok({ deleted });
  } catch (error) {
    return handleError(error);
  }
}
