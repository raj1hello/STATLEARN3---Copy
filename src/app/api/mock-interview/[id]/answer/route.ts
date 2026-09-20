import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import {
  getMockInterviewById,
  recordQuestionAnswer,
  addQuestionToInterview,
} from "@/db/mockInterviews";
import { evaluateAnswerAndGenerateNext } from "@/lib/ai/mockInterviewEngine";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput } from "@/lib/sanitize";

const SubmitAnswerSchema = z.object({
  userAnswer: z.string().min(2, "Answer must contain at least 2 characters").max(4000),
  questionIndex: z.number().int().min(0),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid interview ID format", 400);
    }

    const interview = await getMockInterviewById(id, session.userId);
    if (!interview) {
      return fail("NOT_FOUND", "Interview session not found or unauthorized", 404);
    }

    if (interview.status === "completed") {
      return fail("BAD_REQUEST", "Interview session is already completed", 400);
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = SubmitAnswerSchema.parse(cleanBody);

    const currentQuestion = interview.questions[parsed.questionIndex];
    if (!currentQuestion) {
      return fail("NOT_FOUND", `Question at index ${parsed.questionIndex} does not exist`, 404);
    }

    // Call Claude AI evaluation & adaptive next question generator
    const evalResult = await evaluateAnswerAndGenerateNext({
      targetRole: interview.targetRole,
      difficulty: interview.difficulty,
      questionNumber: parsed.questionIndex + 1,
      totalQuestions: interview.maxQuestions,
      currentQuestion,
      userAnswer: parsed.userAnswer,
      previousQuestions: interview.questions,
    });

    // 1. Record current answer & evaluation
    await recordQuestionAnswer(
      id,
      parsed.questionIndex,
      parsed.userAnswer,
      evalResult.evaluation
    );

    // 2. If next question generated, push it
    if (evalResult.nextQuestion) {
      await addQuestionToInterview(id, evalResult.nextQuestion);
    }

    const updatedInterview = await getMockInterviewById(id, session.userId);

    return ok({
      evaluation: evalResult.evaluation,
      nextQuestion: evalResult.nextQuestion || null,
      isLastQuestion: evalResult.isLastQuestion,
      interview: updatedInterview,
    });
  } catch (error) {
    return handleError(error);
  }
}
