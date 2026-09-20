import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { getConnectionById, respondToConnection } from "@/db/connections";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput } from "@/lib/sanitize";

const RespondConnectionSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid connection ID format", 400);
    }

    const connection = await getConnectionById(id);
    if (!connection) {
      return fail("NOT_FOUND", "Connection request not found", 404);
    }

    // Check ownership: only the requested trainer (or admin) can respond
    if (session.role === "trainer" && connection.trainerId.toString() !== session.userId) {
      return fail("FORBIDDEN", "You can only respond to connection requests sent to you", 403);
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = RespondConnectionSchema.parse(cleanBody);

    const updated = await respondToConnection(id, parsed.status);
    return ok({
      message: `Connection request ${parsed.status}`,
      connection: updated,
    });
  } catch (error) {
    return handleError(error);
  }
}
