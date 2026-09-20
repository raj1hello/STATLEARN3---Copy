import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SessionPayload } from "@/types";
import jwt from "jsonwebtoken";

const { verify } = jwt;

/**
 * Reads and verifies the session cookie for Server Components (layouts/pages).
 * Mirrors MockAuthProvider.getSession so server-side role guards reuse the
 * exact same auth system as the API routes — no second auth source.
 *
 * Returns null when there is no valid session.
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    const payload = verify(token, env.SESSION_SECRET) as SessionPayload;
    return payload;
  } catch {
    // Missing cookie or invalid / expired token.
    return null;
  }
}

/**
 * The home dashboard path for each role. Used so that any role landing on a
 * generic default path is routed to their own workspace.
 */
export const ROLE_HOME: Record<SessionPayload["role"], string> = {
  learner: "/dashboard",
  parent: "/parent",
  trainer: "/trainer",
  admin: "/admin",
  organization: "/organization",
};
