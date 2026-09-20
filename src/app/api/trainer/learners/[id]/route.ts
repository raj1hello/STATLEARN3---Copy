import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { hasAcceptedConnection } from "@/db/connections";
import { findUserById } from "@/db/users";
import { getProfileByUserId } from "@/db/profiles";
import { getUserCompetenciesWithDetails } from "@/db/userCompetencies";
import { getAttemptsByUser } from "@/db/assessmentAttempts";
import { listAssignmentsByTrainer } from "@/db/assignments";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId } from "@/lib/sanitize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid learner ID format", 400);
    }

    // Strict Security: verify accepted connection if trainer
    if (session.role === "trainer") {
      const isConnected = await hasAcceptedConnection(session.userId, id);
      if (!isConnected) {
        return fail("FORBIDDEN", "You are not connected with this learner", 403);
      }
    }

    const learnerUser = await findUserById(id);
    if (!learnerUser) {
      return fail("NOT_FOUND", "Learner not found", 404);
    }

    const [profile, competencies, attempts, assignments] = await Promise.all([
      getProfileByUserId(id),
      getUserCompetenciesWithDetails(id),
      getAttemptsByUser(id),
      listAssignmentsByTrainer(session.userId, id),
    ]);

    // Format safe response (do not expose password hashes or sensitive internal tokens)
    const learnerData = {
      userId: id,
      email: learnerUser.email,
      name: profile?.name || learnerUser.email.split("@")[0] || "Learner",
      stream: profile?.stream,
      designation: profile?.designation,
      department: profile?.department,
      education: profile?.education,
      experience: profile?.experience,
      careerGoal: profile?.careerGoal,
      existingSkills: profile?.existingSkills || [],
      certifications: profile?.certifications || [],
      projects: profile?.projects || [],
      competencies,
      recentAttempts: attempts.slice(0, 10).map((a) => ({
        _id: a._id,
        assessmentId: a.assessmentId,
        score: a.score,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        evidence: a.evidence,
      })),
      assignments,
    };

    return ok(learnerData);
  } catch (error) {
    return handleError(error);
  }
}
