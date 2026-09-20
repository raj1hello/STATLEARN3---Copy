import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import {
  getMockInterviewById,
  completeMockInterview,
} from "@/db/mockInterviews";
import { generateFinalInterviewReport } from "@/lib/ai/mockInterviewEngine";
import { recordProgress } from "@/db/progress";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput, toObjectId } from "@/lib/sanitize";

const FinishInterviewSchema = z.object({
  durationSeconds: z.number().int().min(0).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid interview ID format", 400);
    }

    const interview = await getMockInterviewById(id, session.userId);
    if (!interview) {
      return fail("NOT_FOUND", "Interview session not found or unauthorized", 404);
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = FinishInterviewSchema.parse(cleanBody);

    // If report was already generated, return existing completed interview
    if (interview.status === "completed" && interview.report) {
      return ok({
        report: interview.report,
        interview,
        message: "Interview was already completed",
      });
    }

    // Generate Final Structured Report using Claude AI
    const report = await generateFinalInterviewReport({
      targetRole: interview.targetRole,
      difficulty: interview.difficulty,
      questions: interview.questions,
    });

    // Save final report & complete status
    const completed = await completeMockInterview(
      id,
      report,
      parsed.durationSeconds
    );

    // Record progress event
    await recordProgress({
      userId: toObjectId(session.userId),
      metric: "mock_interview_score",
      value: report.overallScore,
      recordedAt: new Date(),
    });

    return ok({
      report,
      interview: completed,
      message: "AI Mock Interview report generated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
