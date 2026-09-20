import { requireSession } from "@/lib/auth/session";
import { getLearningPathsByUser, createLearningPath } from "@/db/learningPaths";
import { getUserCompetencies } from "@/db/userCompetencies";
import { listCompetencies } from "@/db/competencies";
import { getAttemptsByUser } from "@/db/assessmentAttempts";
import { listCourses } from "@/db/courses";
import { calculateGapAnalysis } from "@/lib/ai/gapEngine";
import { generateStructuredLearningPath } from "@/lib/ai/aiTutor";
import { Question } from "@/types";
import { ok, handleError } from "@/lib/apiResponse";
import { toObjectId } from "@/lib/sanitize";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const paths = await getLearningPathsByUser(session.userId);
    return ok(paths);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);

    // Analyze learner's current gaps and courses
    const userComps = await getUserCompetencies(session.userId);
    const catalogue = await listCompetencies();
    const attempts = await getAttemptsByUser(session.userId);
    const courses = await listCourses({});

    const gapReport = calculateGapAnalysis({
      userId: session.userId,
      userCompetencies: userComps,
      competencyCatalogue: catalogue,
      attempts,
      questionsMap: new Map<string, Question>(),
    });

    // Generate personalized 4-week path
    const structuredPlan = generateStructuredLearningPath(gapReport.competencies, courses);

    const newPath = await createLearningPath({
      userId: toObjectId(session.userId),
      weeks: structuredPlan.weeks as unknown as Record<string, unknown>,
      status: "active",
    });

    return ok(
      {
        ...newPath,
        planMetadata: {
          title: structuredPlan.title,
          description: structuredPlan.description,
          targetCompetencies: structuredPlan.targetCompetencies,
        },
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
