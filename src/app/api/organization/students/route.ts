import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { profilesCol, userCompetenciesCol, assessmentAttemptsCol } from "@/db/collections";
import { ok, handleError } from "@/lib/apiResponse";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    // Role-based authorization: Only organizations and administrators can discover students
    requireRole(session, ["organization", "admin"]);

    const url = new URL(request.url);
    const stream = url.searchParams.get("stream") || undefined;
    const skill = url.searchParams.get("skill") || undefined;

    const pCol = await profilesCol();
    const query: any = {
      shareProfileWithOrganizations: true
    };

    // Strict Tenant Isolation: Organization can only see its own learners.
    // Admin bypasses this.
    if (session.role !== "admin") {
      query.organizationId = new ObjectId(session.userId);
    }

    if (stream && stream !== "all") {
      query.stream = stream;
    }
    if (skill && skill.trim()) {
      query.existingSkills = { $in: [new RegExp(`^${skill.trim()}$`, "i")] };
    }

    // Fetch only consenting student profiles for this organization
    const profiles = await pCol.find(query).toArray();

    if (profiles.length === 0) {
      return ok({
        students: [],
        total: 0,
        message: "No consenting student profiles matched your filter criteria",
      });
    }

    const userIds = profiles.map((p) => p.userId);

    // Fetch verified competency average and test completions for these consenting students
    const [compCol, attemptCol] = await Promise.all([
      userCompetenciesCol(),
      assessmentAttemptsCol(),
    ]);

    const [competencyAgg, attemptAgg] = await Promise.all([
      compCol
        .aggregate<{ _id: string; avgScore: number; count: number }>([
          { $match: { userId: { $in: userIds } } },
          {
            $group: {
              _id: "$userId",
              avgScore: { $avg: "$currentScore" },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
      attemptCol
        .aggregate<{ _id: string; totalAttempts: number; avgAttemptScore: number }>([
          { $match: { userId: { $in: userIds } } },
          {
            $group: {
              _id: "$userId",
              totalAttempts: { $sum: 1 },
              avgAttemptScore: { $avg: "$score" },
            },
          },
        ])
        .toArray(),
    ]);

    const compMap = new Map(competencyAgg.map((c) => [c._id.toString(), c]));
    const attemptMap = new Map(attemptAgg.map((a) => [a._id.toString(), a]));

    const students = profiles.map((p) => {
      const uidStr = p.userId.toString();
      const compInfo = compMap.get(uidStr);
      const attemptInfo = attemptMap.get(uidStr);

      return {
        id: uidStr,
        name: p.name || "Student",
        designation: p.designation || "Learner",
        department: p.department || "Academic Division",
        stream: p.stream || "Statistics & Analytics",
        education: p.education || "Undergraduate / Graduate",
        experience: p.experience || 0,
        careerGoal: p.careerGoal || "Data & Statistical Professional",
        verifiedSkills: p.existingSkills || [],
        certifications: p.certifications || [],
        projects: p.projects || [],
        verifiedCompetencyScore: compInfo ? Math.round(compInfo.avgScore) : 0,
        totalAssessmentsCompleted: attemptInfo ? attemptInfo.totalAttempts : 0,
        avgAssessmentScore: attemptInfo ? Math.round(attemptInfo.avgAttemptScore) : 0,
      };
    });

    return ok({
      students,
      total: students.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
