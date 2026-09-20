import { SessionPayload, UserRole } from "@/types";
import { Errors } from "@/lib/apiResponse";

/**
 * Checks if the session has at least one of the allowed roles.
 * Throws Forbidden error if unauthorized.
 */
export function requireRole(session: SessionPayload | null, allowedRoles: UserRole[]): void {
  if (!session) {
    throw Errors.unauthorized();
  }
  if (!allowedRoles.includes(session.role)) {
    throw Errors.forbidden();
  }
}

/**
 * Helper to ensure a user is acting on their own resource.
 */
export function requireOwner(session: SessionPayload, resourceOwnerId: string): void {
  if (session.userId !== resourceOwnerId && session.role !== "admin") {
    throw Errors.forbidden();
  }
}
