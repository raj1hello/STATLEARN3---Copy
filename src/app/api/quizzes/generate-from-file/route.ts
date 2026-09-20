import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { createAssessment } from "@/db/assessments";
import { insertQuestions } from "@/db/questions";
import { createLearningMaterial } from "@/db/learningMaterials";
import { processLearningMaterialText } from "@/lib/ai/contentAnalyzer";
import { generateQuizQuestions } from "@/lib/ai/assessmentGenerator";
import { ok, fail, handleError, Errors } from "@/lib/apiResponse";
import { sanitizeInput, toObjectId } from "@/lib/sanitize";

const GenerateFromFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().optional(),
  extractedText: z.string().min(10, "Document text content is too short or unreadable"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(20).default(5),
  type: z.enum(["mcq", "scenario"]).default("mcq"),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);

    // Rate limiting: 6 document quiz generations per minute per user
    const rateCheck = checkRateLimit(`quiz-from-file:${session.userId}`, {
      windowMs: 60 * 1000,
      max: 6,
    });
    if (!rateCheck.allowed) {
      throw Errors.rateLimited();
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = GenerateFromFileSchema.parse(cleanBody);

    // 1. Process document content through extraction & AI analysis
    const processed = await processLearningMaterialText(parsed.extractedText, parsed.fileName);

    // 2. Store learning material record for user tracking
    const userObjId = toObjectId(session.userId);
    const material = await createLearningMaterial({
      uploadedById: userObjId,
      fileName: parsed.fileName,
      extractedText: processed.extractedText,
      chunks: { items: processed.chunks, topics: processed.topics, summary: processed.summary },
      createdAt: new Date(),
    });

    const topic = processed.topics[0] || parsed.fileName.replace(/\.[^/.]+$/, "");
    const title = `CBT Quiz: ${topic} (${parsed.fileName})`;

    // Match competency from catalogue if possible
    const { listCompetencies } = await import("@/db/competencies");
    const catalogue = await listCompetencies();
    const matchedComp = catalogue.find(
      (c) =>
        topic.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(topic.toLowerCase())
    );

    // 3. Create Quiz scoped to authenticated user and marked published for instant CBT running
    const assessment = await createAssessment({
      title,
      type: parsed.type,
      kind: "quiz",
      competencyId: matchedComp?._id,
      materialId: material._id,
      createdById: userObjId,
      published: true,
      createdAt: new Date(),
    });

    // 4. Generate CBT Questions via AI pipeline
    const questions = await generateQuizQuestions({
      materialText: processed.extractedText,
      topic,
      competencyId: matchedComp?._id,
      assessmentId: assessment._id!,
      count: parsed.count,
      difficulty: parsed.difficulty,
      type: parsed.type,
    });

    // 5. Save Questions in DB
    const questionIds = await insertQuestions(questions);

    return ok(
      {
        assessmentId: assessment._id!.toHexString(),
        assessment: {
          _id: assessment._id,
          title: assessment.title,
          type: assessment.type,
          published: assessment.published,
          createdAt: assessment.createdAt,
        },
        totalQuestions: questionIds.length,
        message: `Successfully generated CBT Quiz with ${questionIds.length} questions from ${parsed.fileName}.`,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
