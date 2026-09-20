import { requireSession } from "@/lib/auth/session";
import { getUserCompetencies } from "@/db/userCompetencies";
import { listCompetencies } from "@/db/competencies";
import { getAttemptsByUser } from "@/db/assessmentAttempts";
import { calculateGapAnalysis } from "@/lib/ai/gapEngine";
import { Question } from "@/types";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);

    // Fetch user competencies, catalogue, and user past assessment attempts
    const userComps = await getUserCompetencies(session.userId);
    const catalogue = await listCompetencies();
    const attempts = await getAttemptsByUser(session.userId);

    const questionsMap = new Map<string, Question>();

    const report = calculateGapAnalysis({
      userId: session.userId,
      userCompetencies: userComps,
      competencyCatalogue: catalogue,
      attempts,
      questionsMap,
    });

    return ok(report);
  } catch (error) {
    return handleError(error);
  }
}
