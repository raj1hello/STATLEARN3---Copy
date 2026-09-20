import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getAssessmentById } from "@/db/assessments";
import { getQuestionsByAssessment } from "@/db/questions";
import { createAttempt } from "@/db/assessmentAttempts";
import { recordCompetencyScore } from "@/db/userCompetencies";
import { recordProgress } from "@/db/progress";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput, toObjectId } from "@/lib/sanitize";

const SubmitAssessmentSchema = z.object({
  startedAt: z.string().datetime().optional(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswerIndex: z.number().int().nonnegative(),
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
      return fail("INVALID_ID", "Invalid assessment ID format", 400);
    }

    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return fail("NOT_FOUND", "Assessment not found", 404);
    }

    // Check published and access permissions for learners
    if (session.role === "learner") {
      if (!assessment.published) {
        return fail("FORBIDDEN", "This assessment cannot be submitted yet", 403);
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
        return fail("FORBIDDEN", "You do not have permission to submit this assessment", 403);
      }
    }

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = SubmitAssessmentSchema.parse(cleanBody);

    const questions = await getQuestionsByAssessment(id);
    const questionMap = new Map(questions.map((q) => [q._id!.toHexString(), q]));

    // SERVER-SIDE SCORE & EVIDENCE CALCULATION
    let correctCount = 0;
    const totalQuestions = questions.length;
    const evidenceItems: {
      questionId: string;
      questionText: string;
      difficulty: string;
      competencyId?: string;
      selectedAnswerIndex: number;
      isCorrect: boolean;
      explanation?: string;
    }[] = [];

    for (const ans of parsed.answers) {
      const q = questionMap.get(ans.questionId);
      if (!q) continue;

      const selectedOption = q.answers[ans.selectedAnswerIndex];
      const isCorrect = selectedOption ? selectedOption.isCorrect : false;

      if (isCorrect) correctCount++;

      evidenceItems.push({
        questionId: ans.questionId,
        questionText: q.text,
        difficulty: q.difficulty,
        competencyId: q.competencyId?.toHexString() || assessment.competencyId?.toHexString(),
        selectedAnswerIndex: ans.selectedAnswerIndex,
        isCorrect,
        explanation: selectedOption?.explanation || (isCorrect ? "Correct answer" : "Incorrect answer"),
      });
    }

    const calculatedScore =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const startedAt = parsed.startedAt ? new Date(parsed.startedAt) : new Date(Date.now() - 15 * 60 * 1000);
    const completedAt = new Date();

    // Create the attempt record
    const attempt = await createAttempt({
      userId: toObjectId(session.userId),
      assessmentId: toObjectId(id),
      score: calculatedScore,
      evidence: {
        totalQuestions,
        correctCount,
        scorePercentage: calculatedScore,
        items: evidenceItems,
      },
      startedAt,
      completedAt,
    });

    // Resolve evaluated competencies and update user competency scores
    // 1. Direct assessment competency
    // 2. Question-level competencies
    // 3. If no competency linked, find matching or default competency from catalogue
    const evaluatedCompetencyIds = new Set<string>();
    if (assessment.competencyId) {
      evaluatedCompetencyIds.add(assessment.competencyId.toHexString());
    }
    for (const item of evidenceItems) {
      if (item.competencyId) {
        evaluatedCompetencyIds.add(item.competencyId);
      }
    }

    if (evaluatedCompetencyIds.size === 0) {
      // Find matching competency by title or fallback to first catalogue competency
      const { listCompetencies, getCompetencyByName } = await import("@/db/competencies");
      const catalogue = await listCompetencies();
      let matchedComp = catalogue.find(
        (c) =>
          assessment.title.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(assessment.title.toLowerCase())
      );
      if (!matchedComp && catalogue.length > 0) {
        matchedComp = catalogue[0];
      }
      if (matchedComp?._id) {
        evaluatedCompetencyIds.add(matchedComp._id.toHexString());
      }
    }

    // Record competency scores for all evaluated competencies
    for (const compIdStr of Array.from(evaluatedCompetencyIds)) {
      // If questions had specific competency mappings, compute score per competency
      const compItems = evidenceItems.filter((item) => item.competencyId === compIdStr);
      let compScore = calculatedScore;
      if (compItems.length > 0) {
        const compCorrect = compItems.filter((item) => item.isCorrect).length;
        compScore = Math.round((compCorrect / compItems.length) * 100);
      }

      await recordCompetencyScore({
        userId: session.userId,
        competencyId: toObjectId(compIdStr),
        score: compScore,
      });
    }

    // Record progress event
    await recordProgress({
      userId: toObjectId(session.userId),
      metric: "assessment_score",
      value: calculatedScore,
      recordedAt: completedAt,
    });

    // If this assessment was assigned to this learner, mark assignment completed
    const { markAssignmentAttempt } = await import("@/db/assignments");
    await markAssignmentAttempt(session.userId, id, "completed");

    return ok({
      attemptId: attempt._id,
      score: calculatedScore,
      correctCount,
      totalQuestions,
      completedAt,
      evidence: attempt.evidence,
    });
  } catch (error) {
    return handleError(error);
  }
}
