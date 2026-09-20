import { requireSession } from "@/lib/auth/session";
import { listAssessments } from "@/db/assessments";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const { searchParams } = new URL(request.url);
    const competencyId = searchParams.get("competencyId") || undefined;

    // Learners only see quizzes they created or official quizzes
    if (session.role === "learner") {
      const quizzes = await listAssessments({
        publishedOnly: true,
        competencyId,
        learnerUserId: session.userId,
        kind: "quiz",
      });
      return ok(quizzes);
    }

    // Trainers and admins can see all or filter by creator
    const myOnly = searchParams.get("myOnly") === "true";
    const quizzes = await listAssessments({
      createdById: myOnly ? session.userId : undefined,
      competencyId,
      kind: "quiz",
    });
    return ok(quizzes);
  } catch (error) {
    return handleError(error);
  }
}
