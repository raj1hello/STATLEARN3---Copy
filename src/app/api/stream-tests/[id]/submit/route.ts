import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getAssessmentById } from "@/db/assessments";
import { getQuestionsByAssessment } from "@/db/questions";
import { createAttempt } from "@/db/assessmentAttempts";
import { recordCompetencyScore } from "@/db/userCompetencies";
import { recordProgress } from "@/db/progress";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput, toObjectId } from "@/lib/sanitize";

const SubmitStreamTestSchema = z.object({
  startedAt: z.string().datetime().optional(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswerIndex: z.number().int().min(-1), // -1 represents skipped/unanswered
    })
  ),
});

export async function POST(
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

    if (session.role === "learner" && !test.published) {
      return fail("FORBIDDEN", "This stream test is not currently available for submission", 403);
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = SubmitStreamTestSchema.parse(cleanBody);

    const questions = await getQuestionsByAssessment(id);
    const questionMap = new Map(questions.map((q) => [q._id!.toHexString(), q]));

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const totalQuestions = questions.length;

    const answerMap = new Map(parsed.answers.map((a) => [a.questionId, a.selectedAnswerIndex]));

    const evidenceItems: {
      questionId: string;
      questionText: string;
      difficulty: string;
      selectedAnswerIndex: number;
      isCorrect: boolean;
      isUnanswered: boolean;
      correctAnswerIndex: number;
      correctAnswerText: string;
      explanation: string;
    }[] = [];

    const strengths: string[] = [];
    const weakAreas: string[] = [];

    for (const q of questions) {
      const qIdStr = q._id!.toHexString();
      const selectedIndex = answerMap.has(qIdStr) ? answerMap.get(qIdStr)! : -1;

      const correctOptionIndex = q.answers.findIndex((a) => a.isCorrect);
      const correctOption = q.answers[correctOptionIndex];

      if (selectedIndex === -1 || selectedIndex === undefined) {
        unansweredCount++;
        evidenceItems.push({
          questionId: qIdStr,
          questionText: q.text,
          difficulty: q.difficulty,
          selectedAnswerIndex: -1,
          isCorrect: false,
          isUnanswered: true,
          correctAnswerIndex: correctOptionIndex,
          correctAnswerText: correctOption?.text || "",
          explanation: correctOption?.explanation || "Unanswered question.",
        });
        weakAreas.push(`Unanswered question on: "${q.text.slice(0, 60)}..."`);
      } else {
        const selectedOption = q.answers[selectedIndex];
        const isCorrect = Boolean(selectedOption?.isCorrect);

        if (isCorrect) {
          correctCount++;
          strengths.push(`Mastered ${q.difficulty} concept: "${q.text.slice(0, 50)}..."`);
        } else {
          incorrectCount++;
          weakAreas.push(`Review needed for: "${q.text.slice(0, 50)}..."`);
        }

        evidenceItems.push({
          questionId: qIdStr,
          questionText: q.text,
          difficulty: q.difficulty,
          selectedAnswerIndex: selectedIndex,
          isCorrect,
          isUnanswered: false,
          correctAnswerIndex: correctOptionIndex,
          correctAnswerText: correctOption?.text || "",
          explanation:
            selectedOption?.explanation ||
            correctOption?.explanation ||
            (isCorrect ? "Correct answer" : "Incorrect answer"),
        });
      }
    }

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = percentage >= (test.passingScore || 60);

    const startedAt = parsed.startedAt ? new Date(parsed.startedAt) : new Date(Date.now() - 20 * 60 * 1000);
    const completedAt = new Date();

    // Deduplicate strengths & weak areas
    const uniqueStrengths = Array.from(new Set(strengths)).slice(0, 5);
    const uniqueWeakAreas = Array.from(new Set(weakAreas)).slice(0, 5);

    if (uniqueStrengths.length === 0 && percentage >= 50) {
      uniqueStrengths.push(`Solid grasp of foundational ${test.stream || "stream"} principles`);
    }
    if (uniqueWeakAreas.length === 0 && percentage < 100) {
      uniqueWeakAreas.push(`Speed and precision under timed test conditions`);
    }

    // Create the assessment attempt
    const attempt = await createAttempt({
      userId: toObjectId(session.userId),
      assessmentId: toObjectId(id),
      score: percentage,
      evidence: {
        totalQuestions,
        correctCount,
        incorrectCount,
        unansweredCount,
        scorePercentage: percentage,
        isPassed,
        strengths: uniqueStrengths,
        weakAreas: uniqueWeakAreas,
        stream: test.stream,
        items: evidenceItems,
      },
      startedAt,
      completedAt,
    });

    // If test is linked to a competency or stream, record competency progression
    if (test.competencyId) {
      await recordCompetencyScore({
        userId: session.userId,
        competencyId: test.competencyId,
        score: percentage,
      });
    }

    // Record progress event
    await recordProgress({
      userId: toObjectId(session.userId),
      metric: `stream_test_${test.stream || "general"}`,
      value: percentage,
      recordedAt: completedAt,
    });

    // If this stream test was assigned to this learner, mark assignment completed
    const { markAssignmentAttempt } = await import("@/db/assignments");
    await markAssignmentAttempt(session.userId, id, "completed");

    return ok({
      attemptId: attempt._id,
      testId: id,
      title: test.title,
      stream: test.stream,
      score: percentage,
      percentage,
      isPassed,
      passingScore: test.passingScore || 60,
      totalQuestions,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unansweredQuestions: unansweredCount,
      strengths: uniqueStrengths,
      weakAreas: uniqueWeakAreas,
      completionDate: completedAt,
      evidence: attempt.evidence,
    });
  } catch (error) {
    return handleError(error);
  }
}
