import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { usersCol, profilesCol, assessmentAttemptsCol, userCompetenciesCol, competenciesCol } from "@/db/collections";
import { ok, handleError } from "@/lib/apiResponse";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    // Explicitly enforce that ONLY organization can access this specific endpoint
    requireRole(session, ["organization"]);

    const organizationId = session.userId;

    const [uCol, pCol, aCol, ucCol, compCol] = await Promise.all([
      usersCol(),
      profilesCol(),
      assessmentAttemptsCol(),
      userCompetenciesCol(),
      competenciesCol(),
    ]);

    // 1. Overview counts
    // Enforce tenant isolation by only looking at profiles mapped to this organization
    const orgProfiles = await pCol.find({
      organizationId: new ObjectId(organizationId)
    }).toArray();

    const studentUserIds = orgProfiles.map(p => p.userId);

    // We also only include "learner" role to prevent trainers polluting the analytics
    const orgLearners = await uCol.find({
      _id: { $in: studentUserIds },
      role: "learner"
    }).toArray();

    const learnerIds = orgLearners.map(l => l._id!);
    const learnerIdsExtracted = learnerIds.map(id => id.toHexString());

    const learnerProfiles = orgProfiles.filter(p =>
      learnerIdsExtracted.includes(p.userId.toHexString())
    );

    const [totalAttempts, userCompetencies, allCompetencies] = await Promise.all([
      aCol.find({ userId: { $in: learnerIds } }).toArray(),
      ucCol.find({ userId: { $in: learnerIds } }).toArray(),
      compCol.find({}).toArray(),
    ]);

    const totalStudents = orgLearners.length;
    const completedAttempts = totalAttempts.length;

    const avgScore =
      completedAttempts > 0
        ? Math.round(totalAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / completedAttempts)
        : 0;

    const activeLearners = learnerProfiles.filter((p) => (p.existingSkills?.length || 0) > 0 || p.name).length;
    const consentingProfilesCount = learnerProfiles.filter((p) => p.shareProfileWithOrganizations).length;

    // 2. Stream-wise student distribution
    const streamCounts: Record<string, number> = {};
    learnerProfiles.forEach((p) => {
      const streamName = p.stream || "Unassigned";
      streamCounts[streamName] = (streamCounts[streamName] || 0) + 1;
    });

    const streamDistribution = Object.entries(streamCounts).map(([stream, count]) => ({
      name: stream,
      students: count,
    }));

    // 3. Competency / Skill distribution
    const compMap = new Map(allCompetencies.map((c) => [c._id!.toString(), c.name]));
    const compScoreSums: Record<string, { total: number; count: number }> = {};

    userCompetencies.forEach((uc) => {
      const name = compMap.get(uc.competencyId.toString()) || "Unknown Competency";
      if (!compScoreSums[name]) compScoreSums[name] = { total: 0, count: 0 };
      compScoreSums[name].total += uc.currentScore;
      compScoreSums[name].count += 1;
    });

    const skillDistribution = totalStudents === 0 ? [] : allCompetencies.map((c) => {
      const stats = compScoreSums[c.name];
      const avg = stats ? Math.round(stats.total / stats.count) : 0;
      return {
        competency: c.name,
        category: c.category || "General",
        averageScore: avg,
        targetScore: 85,
        gap: Math.max(0, 85 - avg),
      };
    }).filter(s => s.averageScore > 0);

    // 4. Performance trends over months
    const monthStats = new Map<string, { count: number; scoreSum: number }>();
    totalAttempts.forEach((a) => {
      if (a.startedAt) {
        const d = new Date(a.startedAt);
        const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        const existing = monthStats.get(monthKey) || { count: 0, scoreSum: 0 };
        existing.count += 1;
        existing.scoreSum += (a.score || 0);
        monthStats.set(monthKey, existing);
      }
    });

    const performanceTrends = Array.from(monthStats.entries()).map(([month, data]) => ({
      month,
      averageScore: Math.round(data.scoreSum / data.count),
      assessmentsTaken: data.count,
    })).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // 5. Score bracket distribution
    const scoreDistribution = [
      { name: "Expert (80-100%)", value: totalAttempts.filter(a => (a.score || 0) >= 80).length, color: "#7C3AED" },
      { name: "Proficient (60-79%)", value: totalAttempts.filter(a => (a.score || 0) >= 60 && (a.score || 0) < 80).length, color: "#3B82F6" },
      { name: "Developing (40-59%)", value: totalAttempts.filter(a => (a.score || 0) >= 40 && (a.score || 0) < 60).length, color: "#F59E0B" },
      { name: "Beginner (<40%)", value: totalAttempts.filter(a => (a.score || 0) < 40).length, color: "#EF4444" },
    ];

    return ok({
      overview: {
        totalStudents,
        consentingStudents: consentingProfilesCount,
        activeLearners,
        completedAssessments: completedAttempts,
        averageAssessmentScore: avgScore,
        completedCoursesCount: 0,
        participationRate: totalStudents > 0 ? (activeLearners / totalStudents * 100).toFixed(1) + "%" : "0%",
      },
      streamDistribution,
      skillDistribution,
      scoreDistribution,
      performanceTrends,
    });
  } catch (error) {
    return handleError(error);
  }
}
