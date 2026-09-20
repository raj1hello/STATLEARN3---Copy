import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { getAssessmentById, updateAssessment, deleteAssessment } from "@/db/assessments";
import { getQuestionsByAssessment } from "@/db/questions";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput } from "@/lib/sanitize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid stream test ID format", 400);
    }

    const test = await getAssessmentById(id);
    if (!test) {
      return fail("NOT_FOUND", "Stream test not found", 404);
    }

    const isPrivileged = session.role === "trainer" || session.role === "admin";
    if (!isPrivileged && !test.published) {
      return fail("FORBIDDEN", "This stream test is not yet available", 403);
    }

    // If learner accesses an assigned stream test with status new, mark as in_progress
    if (session.role === "learner") {
      const { markAssignmentAttempt } = await import("@/db/assignments");
      await markAssignmentAttempt(session.userId, id, "in_progress");
    }

    const questions = await getQuestionsByAssessment(id);

    // CRITICAL SECURITY RULE: Do NOT expose correct answers to learners before submission!
    const sanitizedQuestions = questions.map((q) => {
      if (isPrivileged) {
        return q;
      }
      return {
        _id: q._id,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        marks: q.marks || 1,
        answers: q.answers.map((ans) => ({
          text: ans.text,
          // isCorrect and explanation stripped for learners
        })),
      };
    });

    return ok({
      ...test,
      questions: sanitizedQuestions,
      totalQuestions: sanitizedQuestions.length,
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
      return fail("INVALID_ID", "Invalid stream test ID format", 400);
    }

    const test = await getAssessmentById(id);
    if (!test) {
      return fail("NOT_FOUND", "Stream test not found", 404);
    }

    // If trainer, check ownership (admins can edit any)
    if (session.role === "trainer" && test.createdById.toHexString() !== session.userId) {
      return fail("FORBIDDEN", "You can only edit tests you authored", 403);
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);

    const updated = await updateAssessment(id, cleanBody as any);
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
      return fail("INVALID_ID", "Invalid stream test ID format", 400);
    }

    const test = await getAssessmentById(id);
    if (!test) {
      return fail("NOT_FOUND", "Stream test not found", 404);
    }

    if (session.role === "trainer" && test.createdById.toHexString() !== session.userId) {
      return fail("FORBIDDEN", "You can only delete tests you authored", 403);
    }

    const success = await deleteAssessment(id);
    return ok({ success, message: "Stream test deleted successfully" });
  } catch (error) {
    return handleError(error);
  }
}
