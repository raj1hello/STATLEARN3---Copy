import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createMockInterview, listMockInterviewsByUser } from "@/db/mockInterviews";
import { generateFirstQuestion } from "@/lib/ai/mockInterviewEngine";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/sanitize";

const StartInterviewSchema = z.object({
  targetRole: z.string().min(2).max(100),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  jobDescription: z.string().max(2000).optional(),
  maxQuestions: z.number().int().min(3).max(15).default(5),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const interviews = await listMockInterviewsByUser(session.userId);

    const summaries = interviews.map((inv) => ({
      _id: inv._id,
      targetRole: inv.targetRole,
      difficulty: inv.difficulty,
      status: inv.status,
      maxQuestions: inv.maxQuestions,
      totalQuestionsAsked: inv.questions.length,
      overallScore: inv.report?.overallScore || null,
      startedAt: inv.startedAt,
      completedAt: inv.completedAt,
      durationSeconds: inv.durationSeconds,
    }));

    return ok(summaries);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = StartInterviewSchema.parse(cleanBody);

    // Generate first question via Claude AI engine
    const firstQuestion = await generateFirstQuestion({
      targetRole: parsed.targetRole,
      difficulty: parsed.difficulty,
      jobDescription: parsed.jobDescription,
    });

    const interview = await createMockInterview({
      userId: session.userId,
      targetRole: parsed.targetRole,
      difficulty: parsed.difficulty,
      jobDescription: parsed.jobDescription,
      maxQuestions: parsed.maxQuestions,
      initialQuestion: firstQuestion,
    });

    return ok({
      interviewId: interview._id!.toHexString(),
      interview,
      currentQuestion: firstQuestion,
      message: "AI Mock Interview session started successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
