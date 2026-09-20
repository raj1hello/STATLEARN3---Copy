import { requireSession } from "@/lib/auth/session";
import { listStreams } from "@/db/streams";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    // Authenticate user session
    await requireSession(request);
    const streams = await listStreams();
    return ok(streams);
  } catch (error) {
    return handleError(error);
  }
}
