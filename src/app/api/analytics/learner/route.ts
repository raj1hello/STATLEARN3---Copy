import { requireSession } from "@/lib/auth/session";
import { getUserCompetencies } from "@/db/userCompetencies";
import { listCompetencies } from "@/db/competencies";
import { getAttemptsByUser } from "@/db/assessmentAttempts";
import { getProgressByUser } from "@/db/progress";
import { getRecommendationsByUser } from "@/db/recommendations";
import { getLearningPathsByUser } from "@/db/learningPaths";
import { analyzeAllUserCompetencies } from "@/lib/ai/competencyAnalyzer";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);

    const userComps = await getUserCompetencies(session.userId);
    const catalogue = await listCompetencies();
    const attempts = await getAttemptsByUser(session.userId);
    const progressList = await getProgressByUser(session.userId);
    const recommendations = await getRecommendationsByUser(session.userId);
    const learningPaths = await getLearningPathsByUser(session.userId);

    // 1. Competency Performance & Gap Analysis
    const compReport = analyzeAllUserCompetencies(userComps);

    // Map catalogue names to items
    const catalogueMap = new Map(catalogue.map((c) => [c._id!.toHexString(), c.name]));
    const enrichComp = (item: any) => ({
      ...item,
      competencyName: catalogueMap.get(item.competencyId) || "Competency",
    });

    const enrichedItems = compReport.items.map(enrichComp);
    const enrichedStrong = compReport.strongAreas.map(enrichComp);
    const enrichedWeak = compReport.weakAreas.map(enrichComp);

    // 2. Assessment History & Before/After Improvement Tracking
    const assessmentScores = attempts.map((a) => a.score);
    const averageAssessmentScore =
      assessmentScores.length > 0
        ? Math.round(assessmentScores.reduce((sum, s) => sum + s, 0) / assessmentScores.length)
        : 0;

    // Group attempts by assessment to calculate before/after improvement per assessment
    const attemptsByAssessment = new Map<string, typeof attempts>();
    for (const a of attempts) {
      const aid = a.assessmentId.toHexString();
      const existing = attemptsByAssessment.get(aid) || [];
      existing.push(a);
      attemptsByAssessment.set(aid, existing);
    }

    const improvementBreakdown = Array.from(attemptsByAssessment.entries()).map(
      ([assessmentId, list]) => {
        const sorted = list.sort(
          (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );
        const beforeScore = sorted[0]?.score ?? 0;
        const afterScore = sorted[sorted.length - 1]?.score ?? beforeScore;
        const rawImprovement = afterScore - beforeScore;
        const percentageGain =
          beforeScore > 0 ? Math.round(((afterScore - beforeScore) / beforeScore) * 100) : 0;

        return {
          assessmentId,
          totalAttempts: sorted.length,
          beforeScore,
          afterScore,
          rawImprovement,
          percentageGain,
        };
      }
    );

    // Overall aggregate improvement across all assessments
    const totalRawImprovement = improvementBreakdown.reduce((sum, i) => sum + i.rawImprovement, 0);

    return ok({
      userId: session.userId,
      email: session.email,
      summary: {
        totalCompetenciesTracked: compReport.totalCompetencies,
        overallAverageCompetencyScore: compReport.overallAverageScore,
        totalAssessmentsTaken: attempts.length,
        averageAssessmentScore,
        totalRecommendations: recommendations.length,
        activeLearningPaths: learningPaths.filter((p) => p.status === "active").length,
        overallImprovementPoints: totalRawImprovement,
      },
      competencies: {
        strongAreas: enrichedStrong,
        weakAreas: enrichedWeak,
        all: enrichedItems,
      },
      improvementTracking: {
        assessments: improvementBreakdown,
        overallPointsGained: totalRawImprovement,
      },
      recentProgressEvents: progressList.slice(0, 10),
      learningPaths: learningPaths.map((lp) => ({
        _id: lp._id,
        status: lp.status,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
