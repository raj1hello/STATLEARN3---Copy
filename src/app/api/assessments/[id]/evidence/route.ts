import { requireSession } from "@/lib/auth/session";
import { getLatestAttempt, getAttemptsByUserAndAssessment } from "@/db/assessmentAttempts";
import { getAssessmentById } from "@/db/assessments";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId } from "@/lib/sanitize";

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

    const attempts = await getAttemptsByUserAndAssessment(session.userId, id);
    if (attempts.length === 0) {
      return fail("NOT_FOUND", "No completed submissions found for this assessment", 404);
    }

    const latest = attempts[attempts.length - 1];

    // Compute progress trend across all attempts for this assessment
    const attemptHistory = attempts.map((a, idx) => ({
      attemptNumber: idx + 1,
      attemptId: a._id,
      score: a.score,
      completedAt: a.completedAt,
    }));

    const firstScore = attempts[0]?.score ?? 0;
    const latestScore = latest?.score ?? 0;
    const improvement = latestScore - firstScore;

    return ok({
      assessmentId: id,
      assessmentTitle: assessment.title,
      userId: session.userId,
      totalAttempts: attempts.length,
      firstScore,
      latestScore,
      improvement,
      latestEvidence: latest?.evidence,
      attemptHistory,
    });
  } catch (error) {
    return handleError(error);
  }
}
