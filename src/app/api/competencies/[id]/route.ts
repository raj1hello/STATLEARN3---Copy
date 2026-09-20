import { requireSession } from "@/lib/auth/session";
import { getCompetencyById } from "@/db/competencies";
import { getUserCompetency } from "@/db/userCompetencies";
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
      return fail("INVALID_ID", "Invalid competency ID format", 400);
    }

    const competency = await getCompetencyById(id);
    if (!competency) {
      return fail("NOT_FOUND", "Competency not found", 404);
    }

    // Learners get their personal performance data for this competency
    if (session.role === "learner") {
      const userComp = await getUserCompetency(session.userId, id);
      return ok({
        ...competency,
        userScore: userComp
          ? {
              currentScore: userComp.currentScore,
              targetScore: userComp.targetScore,
              history: userComp.history,
            }
          : null,
      });
    }

    return ok(competency);
  } catch (error) {
    return handleError(error);
  }
}
