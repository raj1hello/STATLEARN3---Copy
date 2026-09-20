import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { listAssessments, createAssessment } from "@/db/assessments";
import { questionsCol } from "@/db/collections";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { sanitizeInput, toObjectId } from "@/lib/sanitize";
import { Question } from "@/types";

const CreateStreamTestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  stream: z.string().min(1).max(50),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  durationMinutes: z.number().int().positive().max(180).default(30),
  passingScore: z.number().min(0).max(100).default(60),
  published: z.boolean().default(true),
  questions: z.array(
    z.object({
      text: z.string().min(5),
      type: z.enum(["mcq", "scenario"]).default("mcq"),
      difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
      marks: z.number().positive().default(1),
      answers: z.array(
        z.object({
          text: z.string().min(1),
          isCorrect: z.boolean(),
          explanation: z.string().optional(),
        })
      ).min(2),
    })
  ).min(1),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);
    const stream = url.searchParams.get("stream") || undefined;
    const myOnly = url.searchParams.get("myOnly") === "true";

    const isPrivileged = session.role === "trainer" || session.role === "admin";

    const filter: Record<string, unknown> = {
      kind: "stream_test",
    };

    if (!isPrivileged || !myOnly) {
      filter.publishedOnly = true;
    }
    if (myOnly && isPrivileged) {
      filter.createdById = session.userId;
    }
    if (stream && stream !== "all") {
      filter.stream = stream;
    }

    const tests = await listAssessments(filter as any);

    // Fetch question counts for each test
    const qCol = await questionsCol();
    const testIds = tests.map((t) => t._id!).filter(Boolean);

    const questionCounts = await qCol
      .aggregate<{ _id: string; count: number }>([
        { $match: { assessmentId: { $in: testIds } } },
        { $group: { _id: "$assessmentId", count: { $sum: 1 } } },
      ])
      .toArray();

    const countMap = new Map(questionCounts.map((q) => [q._id.toString(), q.count]));

    const result = tests.map((t) => ({
      ...t,
      questionCount: countMap.get(t._id!.toString()) || 0,
    }));

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = CreateStreamTestSchema.parse(cleanBody);

    // 1. Create Assessment document
    const assessment = await createAssessment({
      title: parsed.title,
      description: parsed.description,
      type: parsed.questions[0]?.type || "mcq",
      kind: "stream_test",
      stream: parsed.stream,
      createdById: toObjectId(session.userId),
      published: parsed.published,
      isOfficial: session.role === "admin",
      durationMinutes: parsed.durationMinutes,
      passingScore: parsed.passingScore,
      createdAt: new Date(),
    });

    const assessmentId = assessment._id!;

    // 2. Insert questions
    const qCol = await questionsCol();
    const questionDocs: Question[] = parsed.questions.map((q) => ({
      assessmentId,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      aiGenerated: false,
      reviewedByTrainer: true,
      marks: q.marks,
      answers: q.answers,
    }));

    await qCol.insertMany(questionDocs);

    return ok({
      assessmentId: assessmentId.toHexString(),
      assessment,
      totalQuestions: questionDocs.length,
      message: "Stream-based test created successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
