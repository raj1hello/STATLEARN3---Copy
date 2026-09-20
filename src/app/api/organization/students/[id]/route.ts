import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { profilesCol } from "@/db/collections";
import { getUserCompetenciesWithDetails } from "@/db/userCompetencies";
import { getAttemptsByUser } from "@/db/assessmentAttempts";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, toObjectId } from "@/lib/sanitize";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["organization", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid student ID format", 400);
    }

    const pCol = await profilesCol();
    const query: any = {
      userId: toObjectId(id),
      shareProfileWithOrganizations: true
    };

    // Strict Tenant Isolation
    if (session.role !== "admin") {
      query.organizationId = new ObjectId(session.userId);
    }

    // Check if the student exists AND has explicitly enabled organization sharing AND belongs to this org
    const profile = await pCol.findOne(query);
    if (!profile) {
      return fail(
        "FORBIDDEN",
        "Student profile is private or not available for organization viewing",
        403
      );
    }

    // Fetch verified competencies and attempts
    const [competencies, attempts] = await Promise.all([
      getUserCompetenciesWithDetails(id),
      getAttemptsByUser(id),
    ]);

    const sanitizedAttempts = attempts.slice(0, 10).map((a: any) => ({
      _id: a._id,
      assessmentTitle: a.assessmentTitle || "Diagnostic Assessment",
      score: a.score,
      completedAt: a.completedAt,
    }));

    return ok({
      student: {
        id: profile.userId.toString(),
        name: profile.name,
        designation: profile.designation,
        department: profile.department,
        education: profile.education,
        experience: profile.experience,
        stream: profile.stream,
        careerGoal: profile.careerGoal,
        existingSkills: profile.existingSkills || [],
        certifications: profile.certifications || [],
        projects: profile.projects || [],
      },
      verifiedCompetencies: competencies,
      recentAssessments: sanitizedAttempts,
    });
  } catch (error) {
    return handleError(error);
  }
}
