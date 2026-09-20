import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { listConnectedLearners } from "@/db/connections";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);

    const learners = await listConnectedLearners(session.userId);
    return ok({ learners, total: learners.length });
  } catch (error) {
    return handleError(error);
  }
}
