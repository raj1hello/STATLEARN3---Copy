import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import {
  getParentLinkById,
  respondToParentLink,
  revokeParentLink,
} from "@/db/parentLinks";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput } from "@/lib/sanitize";

/**
 * Respond to / revoke a single Parent ↔ Learner link.
 *
 * PATCH  — the LEARNER confirms or declines a pending request.
 *          "accepted" → link becomes active and the parent immediately gains
 *          read access through the existing /api/parent/report route.
 *          Only the learner on the link (or an admin) may respond.
 * DELETE — the PARENT cancels a pending request or revokes an active link
 *          (or an admin removes either side). Revoked is terminal.
 *
 * Authorization is fully server-side; ownership checks use the session id.
 */

const RespondLinkSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["learner", "parent", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid link ID format", 400);
    }

    const link = await getParentLinkById(id);
    if (!link) {
      return fail("NOT_FOUND", "Link request not found", 404);
    }

    // Ownership: only the receiving party (or an admin) responds.
    if (session.role === "learner") {
      if (link.learnerId.toString() !== session.userId) {
        return fail("FORBIDDEN", "You can only respond to links addressed to you", 403);
      }
      if (link.requestedBy === "learner") {
        return fail("INVALID_REQUEST", "You cannot respond to a request you sent", 400);
      }
    } else if (session.role === "parent") {
      if (link.parentId.toString() !== session.userId) {
        return fail("FORBIDDEN", "You can only respond to links addressed to you", 403);
      }
      if (link.requestedBy !== "learner") {
        return fail("INVALID_REQUEST", "You cannot respond to a request you sent", 400);
      }
    }

    // Only a pending link can be responded to.
    if (link.status !== "pending") {
      return fail("INVALID_REQUEST", "This link is no longer pending", 409);
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = RespondLinkSchema.parse(cleanBody);

    const updated = await respondToParentLink(id, parsed.status);
    return ok({
      message:
        parsed.status === "accepted"
          ? "Link activated"
          : "Link declined",
      link: updated,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(_request);
    requireRole(session, ["parent", "learner", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid link ID format", 400);
    }

    const link = await getParentLinkById(id);
    if (!link) {
      return fail("NOT_FOUND", "Link not found", 404);
    }

    // Ownership: either side can revoke/cancel.
    if (session.role === "parent" && link.parentId.toString() !== session.userId) {
      return fail("FORBIDDEN", "You can only revoke your own links", 403);
    }
    if (session.role === "learner" && link.learnerId.toString() !== session.userId) {
      return fail("FORBIDDEN", "You can only revoke your own links", 403);
    }

    const revoked = await revokeParentLink(id);
    if (!revoked) {
      return fail("INVALID_REQUEST", "This link cannot be revoked anymore", 409);
    }

    return ok({
      message:
        link.status === "pending"
          ? "Link request cancelled"
          : "Link removed",
    });
  } catch (error) {
    return handleError(error);
  }
}
