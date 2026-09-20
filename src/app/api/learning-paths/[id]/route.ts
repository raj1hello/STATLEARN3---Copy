import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getLearningPathById, updateLearningPath } from "@/db/learningPaths";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput } from "@/lib/sanitize";

const PatchLearningPathSchema = z.object({
  status: z.enum(["active", "completed"]).optional(),
  weeks: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid learning path ID format", 400);
    }

    const path = await getLearningPathById(id);
    if (!path) {
      return fail("NOT_FOUND", "Learning path not found", 404);
    }

    // Check ownership
    if (session.role === "learner" && path.userId.toHexString() !== session.userId) {
      return fail("FORBIDDEN", "You can only update your own learning path", 403);
    }

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = PatchLearningPathSchema.parse(cleanBody);

    const updated = await updateLearningPath(id, parsed);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
