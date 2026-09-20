import { requireSession } from "@/lib/auth/session";
import { getUserCompetencies } from "@/db/userCompetencies";
import { listCompetencies } from "@/db/competencies";
import { getAttemptsByUser } from "@/db/assessmentAttempts";
import { listCourses } from "@/db/courses";
import { replaceUserRecommendations } from "@/db/recommendations";
import { calculateGapAnalysis } from "@/lib/ai/gapEngine";
import {
  generateRecommendationsForGaps,
  formatRecommendationsForDb,
} from "@/lib/ai/recommendationEngine";
import { Question } from "@/types";
import { ok, handleError } from "@/lib/apiResponse";
import { toObjectId } from "@/lib/sanitize";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const userIdObj = toObjectId(session.userId);

    // 1. Gather context
    const userComps = await getUserCompetencies(session.userId);
    const catalogue = await listCompetencies();
    const attempts = await getAttemptsByUser(session.userId);
    const courses = await listCourses({});

    // 2. Perform evidence gap analysis
    const gapReport = calculateGapAnalysis({
      userId: session.userId,
      userCompetencies: userComps,
      competencyCatalogue: catalogue,
      attempts,
      questionsMap: new Map<string, Question>(),
    });

    // 3. Generate explainable recommendations
    const generated = generateRecommendationsForGaps({
      userId: userIdObj,
      gaps: gapReport.competencies,
      availableCourses: courses,
    });

    // 4. Save/update to MongoDB
    const dbDocs = formatRecommendationsForDb(userIdObj, generated);
    const stored = await replaceUserRecommendations(session.userId, dbDocs);

    return ok({
      userId: session.userId,
      overallGapIndex: gapReport.overallGapIndex,
      totalRecommendations: generated.length,
      recommendations: generated.map((g, idx) => ({
        _id: stored[idx]?._id,
        courseId: g.courseId,
        courseTitle: g.courseTitle,
        competencyId: g.competencyId,
        competencyName: g.competencyName,
        priority: g.priority,
        reason: g.reason,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
