import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { checkRateLimit } from "@/lib/rateLimit";
import { createAssessment } from "@/db/assessments";
import { insertQuestions } from "@/db/questions";
import { getLearningMaterialById } from "@/db/learningMaterials";
import { generateQuizQuestions } from "@/lib/ai/assessmentGenerator";
import { ok, fail, handleError, Errors } from "@/lib/apiResponse";
import { sanitizeInput, toObjectId, isValidObjectId } from "@/lib/sanitize";

const GenerateQuizSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  materialId: z.string().optional(),
  competencyId: z.string().optional(),
  competencyName: z.string().optional(),
  count: z.number().int().min(1).max(25).default(10), // Target default 10
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  type: z.enum(["mcq", "scenario"]).default("mcq"),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);

    // Rate limiting: 5 generations per minute
    const rateCheck = checkRateLimit(`quiz_gen:${session.userId}`, {
      windowMs: 60 * 1000,
      max: 5,
    });
    if (!rateCheck.allowed) {
      throw Errors.rateLimited();
    }

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = GenerateQuizSchema.parse(cleanBody);

    let materialText: string | undefined;
    if (parsed.materialId) {
      if (!isValidObjectId(parsed.materialId)) {
        return fail("INVALID_ID", "Invalid material ID format", 400);
      }
      const mat = await getLearningMaterialById(parsed.materialId);
      if (!mat) {
        return fail("NOT_FOUND", "Learning material not found", 404);
      }
      materialText = mat.extractedText;
    }

    const compIdObj = parsed.competencyId ? toObjectId(parsed.competencyId) : undefined;
    const matIdObj = parsed.materialId ? toObjectId(parsed.materialId) : undefined;
    const title = parsed.title || `AI Quiz: ${parsed.competencyName || "Assessment"} (${parsed.difficulty})`;

    // 1. Create the Quiz assessment in DRAFT / unpublished state
    const assessment = await createAssessment({
      title,
      type: parsed.type,
      kind: "quiz",
      competencyId: compIdObj,
      materialId: matIdObj,
      createdById: toObjectId(session.userId),
      published: false, // AI-generated assessments MUST NEVER automatically become published!
      createdAt: new Date(),
    });

    // 2. Generate questions with Zod validation
    const generatedQuestions = await generateQuizQuestions({
      materialText,
      competencyName: parsed.competencyName,
      competencyId: compIdObj,
      assessmentId: assessment._id!,
      count: parsed.count,
      difficulty: parsed.difficulty,
      type: parsed.type,
    });

    // 3. Persist generated questions in DRAFT mode
    const questionIds = await insertQuestions(generatedQuestions);

    return ok(
      {
        assessment: {
          _id: assessment._id,
          title: assessment.title,
          published: assessment.published,
          status: "draft_needs_review",
        },
        totalQuestionsGenerated: questionIds.length,
        questions: generatedQuestions.map((q, idx) => ({
          _id: questionIds[idx],
          ...q,
        })),
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
