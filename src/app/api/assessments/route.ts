import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { listAssessments, createAssessment } from "@/db/assessments";
import { ok, handleError } from "@/lib/apiResponse";
import { sanitizeInput, toObjectId } from "@/lib/sanitize";

const CreateAssessmentSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.enum(["mcq", "scenario"]).default("mcq"),
  competencyId: z.string().optional(),
  published: z.boolean().default(false),
  materialId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const { searchParams } = new URL(request.url);
    const competencyId = searchParams.get("competencyId") || undefined;

    // Learners only see official assessments and their own generated assessments (excluding quizzes)
    if (session.role === "learner") {
      const assessments = await listAssessments({
        publishedOnly: true,
        competencyId,
        learnerUserId: session.userId,
        kind: "assessment",
      });
      return ok(assessments);
    }

    // Trainers and admins can see all or filter by creator
    const myOnly = searchParams.get("myOnly") === "true";
    const assessments = await listAssessments({
      createdById: myOnly ? session.userId : undefined,
      competencyId,
      kind: "assessment",
    });
    return ok(assessments);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = CreateAssessmentSchema.parse(cleanBody);

    const doc = {
      title: parsed.title,
      type: parsed.type,
      competencyId: parsed.competencyId ? toObjectId(parsed.competencyId) : undefined,
      materialId: parsed.materialId ? toObjectId(parsed.materialId) : undefined,
      createdById: toObjectId(session.userId),
      published: parsed.published,
      createdAt: new Date(),
    };

    const created = await createAssessment(doc);
    return ok(created, 201);
  } catch (error) {
    return handleError(error);
  }
}
