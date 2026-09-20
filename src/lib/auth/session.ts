import { MockAuthProvider } from "./provider";
import { SessionPayload } from "@/types";
import { Errors } from "@/lib/apiResponse";

/**
 * Reads and returns the current session, or null if not authenticated.
 */
export async function getSession(request: Request): Promise<SessionPayload | null> {
  return MockAuthProvider.getSession(request);
}

/**
 * Reads the current session and throws UNAUTHORIZED if not present.
 */
export async function requireSession(request: Request): Promise<SessionPayload> {
  const session = await MockAuthProvider.getSession(request);
  if (!session) {
    throw Errors.unauthorized();
  }
  return session;
}
