import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { createAssessment } from "@/db/assessments";
import { insertQuestions } from "@/db/questions";
import { generateQuizQuestions } from "@/lib/ai/assessmentGenerator";
import { ok, fail, handleError, Errors } from "@/lib/apiResponse";
import { sanitizeInput, toObjectId } from "@/lib/sanitize";

const ContextActionSchema = z.object({
  action: z.enum(["assessment", "quiz"]),
  topic: z.string().min(2).max(300).optional(),
  conversationContext: z.string().min(10, "A meaningful conversation context is required"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(10).default(5),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);

    // Rate limiting: 8 generation actions per minute per user
    const rateCheck = checkRateLimit(`ai-tutor-action:${session.userId}`, {
      windowMs: 60 * 1000,
      max: 8,
    });
    if (!rateCheck.allowed) {
      throw Errors.rateLimited();
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = ContextActionSchema.parse(cleanBody);

    const topic = parsed.topic || "Statistical Concepts & Application";
    const titlePrefix = parsed.action === "assessment" ? "AI Assessment" : "AI Practice Quiz";
    const title = `${titlePrefix}: ${topic} (${parsed.difficulty})`;

    // Match competency from catalogue if possible
    const { listCompetencies } = await import("@/db/competencies");
    const catalogue = await listCompetencies();
    const matchedComp = catalogue.find(
      (c) =>
        topic.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(topic.toLowerCase())
    );

    // 1. Create the Assessment or Quiz (marked published for learner direct practice)
    const assessment = await createAssessment({
      title,
      type: "mcq",
      kind: parsed.action === "quiz" ? "quiz" : "assessment",
      competencyId: matchedComp?._id,
      createdById: toObjectId(session.userId),
      published: true, // published for learner instant access
      createdAt: new Date(),
    });

    // 2. Generate questions based on the active conversation context
    const generatedQuestions = await generateQuizQuestions({
      materialText: parsed.conversationContext,
      topic,
      competencyId: matchedComp?._id,
      assessmentId: assessment._id!,
      count: parsed.count,
      difficulty: parsed.difficulty,
      type: "mcq",
    });

    // 3. Insert questions into DB
    const questionIds = await insertQuestions(generatedQuestions);

    return ok(
      {
        type: parsed.action,
        assessment: {
          _id: assessment._id,
          title: assessment.title,
          published: assessment.published,
          createdAt: assessment.createdAt,
        },
        totalQuestions: questionIds.length,
        questions: generatedQuestions.map((q, idx) => ({
          _id: questionIds[idx],
          ...q,
        })),
        message:
          parsed.action === "assessment"
            ? `Generated comprehensive assessment with ${questionIds.length} questions based on your conversation.`
            : `Generated adaptive quiz with ${questionIds.length} questions based on your conversation.`,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
