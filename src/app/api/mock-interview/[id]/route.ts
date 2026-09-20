import { requireSession } from "@/lib/auth/session";
import { getMockInterviewById, deleteMockInterview } from "@/db/mockInterviews";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId } from "@/lib/sanitize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid interview ID format", 400);
    }

    // Isolate by authenticated user ID
    const interview = await getMockInterviewById(id, session.userId);
    if (!interview) {
      return fail("NOT_FOUND", "Interview session not found or unauthorized", 404);
    }

    return ok(interview);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid interview ID format", 400);
    }

    const deleted = await deleteMockInterview(id, session.userId);
    if (!deleted) {
      return fail("NOT_FOUND", "Interview session not found or unauthorized", 404);
    }

    return ok({ message: "Interview session deleted", id });
  } catch (error) {
    return handleError(error);
  }
}
