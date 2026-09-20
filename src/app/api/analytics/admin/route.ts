import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { listCompetencies } from "@/db/competencies";
import { getAllAttempts } from "@/db/assessmentAttempts";
import { listAssessments } from "@/db/assessments";
import { getAllRecommendations } from "@/db/recommendations";
import { listUsers } from "@/db/users";
import { profilesCol } from "@/db/collections";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["admin"]);

    const users = await listUsers();
    const competencies = await listCompetencies();
    const attempts = await getAllAttempts();
    const assessments = await listAssessments({});
    const recommendations = await getAllRecommendations();

    const pCol = await profilesCol();
    const profiles = await pCol.find({}).toArray();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const learners = users.filter((u) => u.role === "learner").map(u => ({
      id: u._id?.toString(),
      email: u.email,
      name: profileMap.get(u._id!.toString())?.name || "Unknown Learner",
      stream: profileMap.get(u._id!.toString())?.stream || "Unassigned",
      status: "active",
      lastActive: u.createdAt
    }));

    const trainers = users.filter((u) => u.role === "trainer").map(u => ({
      id: u._id?.toString(),
      email: u.email,
      name: profileMap.get(u._id!.toString())?.name || "Unknown Trainer",
      department: profileMap.get(u._id!.toString())?.department || "General",
      status: "active",
      lastActive: u.createdAt
    }));

    const organizations = users.filter((u) => u.role === "organization").map(u => ({
      id: u._id?.toString(),
      email: u.email,
      name: profileMap.get(u._id!.toString())?.name || u.email.split('@')[0],
      status: "active",
      totalTrainers: 0,
      totalLearners: 0,
      averageScore: 0,
      lastActive: u.createdAt
    }));

    // Calculate aggregate scores
    const attemptsByUser = new Map<string, typeof attempts>();
    for (const a of attempts) {
      if (!a.userId) continue;
      const key = a.userId.toString();
      const existing = attemptsByUser.get(key) || [];
      existing.push(a);
      attemptsByUser.set(key, existing);
    }

    // Attach real assessment counts/scores to learners
    learners.forEach(l => {
      const userAttempts = attemptsByUser.get(l.id!) || [];
      (l as any).totalAssessments = userAttempts.length;
      (l as any).averageScore = userAttempts.length > 0
        ? Math.round(userAttempts.reduce((sum, a) => sum + (a.score||0), 0) / userAttempts.length)
        : null;
    });

    const totalLearners = learners.length;
    const totalTrainers = trainers.length;
    const totalOrganizations = organizations.length;

    // Assessment stats
    const totalAttempts = attempts.length;
    const totalScoreSum = attempts.reduce((sum, a) => sum + (a.score||0), 0);
    const averageAssessmentScore = totalAttempts > 0 ? Math.round(totalScoreSum / totalAttempts) : 0;

    // Score brackets distribution
    const scoreDistribution = {
      excellent_80_100: attempts.filter((a) => (a.score||0) >= 80).length,
      proficient_60_79: attempts.filter((a) => (a.score||0) >= 60 && (a.score||0) < 80).length,
      needsImprovement_below_60: attempts.filter((a) => (a.score||0) < 60).length,
    };

    let pairedAssessmentsCount = 0;
    let totalImprovementPoints = 0;
    let improvedCount = 0;

    const attemptsByUserAndAssessment = new Map<string, typeof attempts>();
    for (const a of attempts) {
      if (!a.userId || !a.assessmentId) continue;
      const key = `${a.userId.toString()}:${a.assessmentId.toString()}`;
      const existing = attemptsByUserAndAssessment.get(key) || [];
      existing.push(a);
      attemptsByUserAndAssessment.set(key, existing);
    }

    for (const list of attemptsByUserAndAssessment.values()) {
      if (list.length >= 2) {
        pairedAssessmentsCount++;
        const sorted = list.sort(
          (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );
        const first = sorted[0]?.score ?? 0;
        const last = sorted[sorted.length - 1]?.score ?? first;
        const diff = last - first;
        totalImprovementPoints += diff;
        if (diff > 0) improvedCount++;
      }
    }

    const averageImprovementGain =
      pairedAssessmentsCount > 0
        ? Math.round((totalImprovementPoints / pairedAssessmentsCount) * 10) / 10
        : 0;
    const effectivenessRate =
      pairedAssessmentsCount > 0
        ? Math.round((improvedCount / pairedAssessmentsCount) * 100)
        : 100;

    return ok({
      organizationOverview: {
        totalUsers: users.length,
        totalLearners,
        totalTrainers,
        totalOrganizations,
        activeOrganizations: organizations.filter(o => o.status === 'active').length,
        activeTrainers: trainers.filter(t => t.status === 'active').length,
        activeLearners: learners.filter(l => l.status === 'active').length,
        totalCompetenciesCatalogue: competencies.length,
        totalAssessmentsAvailable: assessments.length,
        publishedAssessmentsCount: assessments.filter((a) => a.published).length,
      },
      assessmentPerformance: {
        totalAttemptsCompleted: totalAttempts,
        averageAssessmentScore,
        scoreDistribution,
      },
      trainingEffectiveness: {
        pairedAttemptsSampled: pairedAssessmentsCount,
        averageImprovementGainPoints: averageImprovementGain,
        learnerImprovementRatePercentage: effectivenessRate,
      },
      recommendationEngineActivity: {
        totalRecommendationsGenerated: recommendations.length,
      },
      // Raw list feeds for Admin UI tables
      organizations,
      trainers,
      learners,
      recentAttempts: attempts.sort((a,b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 50).map(a => ({
          _id: a._id?.toString(),
          userId: a.userId.toString(),
          userName: profileMap.get(a.userId.toString())?.name || "Unknown",
          score: a.score,
          date: a.startedAt
      }))
    });
  } catch (error) {
    return handleError(error);
  }
}
