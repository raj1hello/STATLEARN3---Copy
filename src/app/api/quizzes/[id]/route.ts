import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { getAssessmentById, updateAssessment } from "@/db/assessments";
import { getQuestionsByAssessment, updateQuestion, deleteQuestion } from "@/db/questions";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput, toObjectId } from "@/lib/sanitize";

const PatchQuizQuestionSchema = z.object({
  questionId: z.string().optional(),
  action: z.enum(["update_question", "delete_question", "publish", "unpublish"]),
  // Optional question fields for update_question
  text: z.string().min(5).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  answers: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
        explanation: z.string().optional(),
      })
    )
    .min(2)
    .optional(),
  reviewedByTrainer: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid quiz ID format", 400);
    }

    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return fail("NOT_FOUND", "Quiz not found", 404);
    }

    const questions = await getQuestionsByAssessment(id);

    return ok({
      assessment,
      totalQuestions: questions.length,
      reviewedCount: questions.filter((q) => q.reviewedByTrainer).length,
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
      return fail("INVALID_ID", "Invalid quiz ID format", 400);
    }

    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return fail("NOT_FOUND", "Quiz assessment not found", 404);
    }

    // Trainers can only review/publish their own assessments
    if (session.role === "trainer" && assessment.createdById.toHexString() !== session.userId) {
      return fail("FORBIDDEN", "You can only manage your own quizzes", 403);
    }

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = PatchQuizQuestionSchema.parse(cleanBody);

    if (parsed.action === "publish") {
      const updated = await updateAssessment(id, { published: true });
      return ok({ message: "Assessment published successfully. Learners can now take it.", assessment: updated });
    }

    if (parsed.action === "unpublish") {
      const updated = await updateAssessment(id, { published: false });
      return ok({ message: "Assessment unpublished.", assessment: updated });
    }

    if (parsed.action === "delete_question") {
      if (!parsed.questionId || !isValidObjectId(parsed.questionId)) {
        return fail("INVALID_ID", "Valid questionId required for deletion", 400);
      }
      await deleteQuestion(parsed.questionId);
      return ok({ message: "Question deleted successfully", questionId: parsed.questionId });
    }

    if (parsed.action === "update_question") {
      if (!parsed.questionId || !isValidObjectId(parsed.questionId)) {
        return fail("INVALID_ID", "Valid questionId required for update", 400);
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.text !== undefined) updateData.text = parsed.text;
      if (parsed.difficulty !== undefined) updateData.difficulty = parsed.difficulty;
      if (parsed.answers !== undefined) updateData.answers = parsed.answers;
      if (parsed.reviewedByTrainer !== undefined) updateData.reviewedByTrainer = parsed.reviewedByTrainer;
      else updateData.reviewedByTrainer = true; // Auto-mark reviewed on edit

      const updatedQ = await updateQuestion(parsed.questionId, updateData);
      return ok({ message: "Question updated successfully", question: updatedQ });
    }

    return fail("BAD_REQUEST", "Unsupported action", 400);
  } catch (error) {
    return handleError(error);
  }
}
