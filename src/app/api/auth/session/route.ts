import { getSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/apiResponse";
import { getProfileByUserId } from "@/db/profiles";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return fail("UNAUTHORIZED", "Not authenticated", 401);
  }

  const profile = await getProfileByUserId(session.userId);

  return ok({
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
    },
    profile,
  });
}
