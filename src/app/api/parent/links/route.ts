import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import {
  createParentLink,
  getParentLinkByPair,
  listParentLinksForParent,
  listParentLinksForLearner,
} from "@/db/parentLinks";
import { findUserByEmail, findUserById } from "@/db/users";
import { getProfileByUserId } from "@/db/profiles";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { sanitizeInput, toObjectId, isValidObjectId } from "@/lib/sanitize";
import { ParentLink } from "@/types";

/**
 * Parent / Guardian ↔ Learner linking workflow.
 *
 * POST — a parent requests a link to a learner BY THEIR EMAIL. The request is
 *        created as `pending`; ONLY the learner (or an admin) can activate it,
 *        so making it "active" always requires an authorized confirmation.
 *        An admin may POST the same body to bootstrap an `active` link directly.
 * GET  — role-aware list:
 *          parent → their own links (pending + active, enriched with learner
 *                   name/email/stream so the parent can manage/react).
 *          learner→ incoming links from parents (pending + active + rejected).
 *          admin  → acts as the requesting side (links for a given parentId).
 *
 * Authorization is 100% server-side. A parent only ever sees rows whose
 * parentId is their own session id; a learner only ever sees rows where they
 * are the learnerId. No unrelated parent/learner info is returned.
 */

const CreateParentLinkSchema = z.object({
  email: z
    .string()
    .min(3, "An email is required")
    .max(320, "Email is too long")
    .transform((v) => v.toLowerCase().trim()),
  // Optional admin override used when an admin boots a parent account's
  // first link on behalf of a parent (bootstrap path, creates active links).
  optional: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") as
      | ParentLink["status"]
      | undefined;

    if (session.role === "parent") {
      const links = await listParentLinksForParent(session.userId);
      const enriched = await enrichWithLearner(links, statusFilter);
      return ok({ links: enriched, total: enriched.length, viewer: "parent" });
    }

    if (session.role === "learner") {
      const links = await listParentLinksForLearner(session.userId);
      const enriched = await enrichWithParent(links, statusFilter);
      return ok({ requests: enriched, total: enriched.length, viewer: "learner" });
    }

    if (session.role === "admin") {
      const parentId = url.searchParams.get("parentId");
      const links = await listParentLinksForParent(
        parentId && isValidObjectId(parentId) ? parentId : session.userId
      );
      const enriched = await enrichWithLearner(links, statusFilter);
      return ok({ links: enriched, total: enriched.length, viewer: "admin" });
    }

    return fail("FORBIDDEN", "Unauthorized role for parent links", 403);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["parent", "learner", "admin"]);

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = CreateParentLinkSchema.parse(cleanBody);

    const targetEmail = parsed.email.toLowerCase().trim();

    // Find target user
    const targetUser = await findUserByEmail(targetEmail);
    if (!targetUser) {
      return fail("NOT_FOUND", "No user found with that email address", 404);
    }

    if (session.userId === targetUser._id!.toString()) {
      return fail("INVALID_REQUEST", "You cannot link to yourself", 400);
    }

    let parentIdStr: string;
    let learnerIdStr: string;
    let requestedBy: "parent" | "learner" | "admin" = "parent";

    if (session.role === "learner") {
      if (targetUser.role !== "parent") {
         return fail("INVALID_REQUEST", "The email provided does not belong to a parent account", 400);
      }
      learnerIdStr = session.userId;
      parentIdStr = targetUser._id!.toString();
      requestedBy = "learner";
    } else if (session.role === "parent") {
      if (targetUser.role !== "learner") {
         return fail("INVALID_REQUEST", "The email provided does not belong to a learner account", 400);
      }
      learnerIdStr = targetUser._id!.toString();
      parentIdStr = session.userId;
      requestedBy = "parent";
    } else if (session.role === "admin") {
      // For simplicity, assume admin is linking a learner to a parent where target is learner,
      // and parentId might need to be passed in... wait, original code used session as parentId for admin!
      // Actually original admin code let admin POST, and it used session.userId as parent.. which means admin was acting as parent.
      // Let's assume admin uses parent as session, or admin is in impersonation.
      // If admin, we'll keep the old behavior: target is learner, session is parent (or we just reject admin here if it doesn't make sense).
      if (targetUser.role !== "learner") {
         return fail("INVALID_REQUEST", "Target must be a learner", 400);
      }
      learnerIdStr = targetUser._id!.toString();
      parentIdStr = session.userId; // This is a bit weird but aligns with old behavior where admin triggered it
      requestedBy = "admin";
    } else {
      return fail("FORBIDDEN", "Unauthorized", 403);
    }

    const isAdmin = session.role === "admin";

    // Dedupe
    const existing = await getParentLinkByPair(parentIdStr, learnerIdStr);

    if (existing) {
      if (existing.status === "pending") {
        return fail("ALREADY_EXISTS", "A link request is already pending between this parent and learner", 409);
      }
      if (existing.status === "active") {
        return fail("ALREADY_CONNECTED", "Parent and learner are already linked", 409);
      }
      // re-request
      const { parentLinksCol } = await import("@/db/collections");
      const col = await parentLinksCol();
      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: isAdmin ? "active" : "pending",
            requestedBy: isAdmin ? "admin" : requestedBy,
            respondedAt: undefined,
            revokedAt: undefined,
            createdAt: new Date(),
          },
        }
      );
      return ok({
        message: isAdmin
          ? "Linked successfully (Admin)"
          : "Link request sent successfully",
        linkId: existing._id!.toString(),
        status: isAdmin ? "active" : "pending",
      });
    }

    // Fresh request
    const actualRequestedBy = isAdmin ? "admin" : requestedBy;
    const link = await createParentLink({
      parentId: toObjectId(parentIdStr),
      learnerId: toObjectId(learnerIdStr),
      status: isAdmin ? "active" : "pending",
      requestedBy: actualRequestedBy,
    });

    return ok({
      message: isAdmin
        ? "Linked successfully"
        : "Link request sent successfully",
      link: {
        ...link,
        _id: link._id!.toString(),
        parentId: link.parentId.toString(),
        learnerId: link.learnerId.toString(),
      },
      status: link.status,
    });
  } catch (error) {
    return handleError(error);
  }
}

// --- enrichment helpers (mirror connections' listEnriched* pattern) ---------

async function enrichWithLearner(
  links: ParentLink[],
  status?: ParentLink["status"]
): Promise<any[]> {
  const filtered = status ? links.filter((l) => l.status === status) : links;
  if (filtered.length === 0) return [];

  const learnerIds = filtered.map((l) => l.learnerId);
  const { profilesCol, usersCol } = await import("@/db/collections");
  const [pCol, uCol] = await Promise.all([profilesCol(), usersCol()]);
  const [profiles, users] = await Promise.all([
    pCol.find({ userId: { $in: learnerIds } }).toArray(),
    uCol.find({ _id: { $in: learnerIds } }).toArray(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

  return filtered.map((l) => {
    const idStr = l.learnerId.toString();
    const p = profileMap.get(idStr);
    const u = userMap.get(idStr);
    return {
      id: l._id!.toString(),
      parentId: l.parentId.toString(),
      learnerId: idStr,
      status: l.status,
      requestedBy: l.requestedBy,
      createdAt: l.createdAt,
      respondedAt: l.respondedAt,
      revokedAt: l.revokedAt,
      learnerName: p?.name || u?.email.split("@")[0] || "Learner",
      learnerEmail: u?.email,
      learnerStream: p?.stream,
    };
  });
}

async function enrichWithParent(
  links: ParentLink[],
  status?: ParentLink["status"]
): Promise<any[]> {
  const filtered = status ? links.filter((l) => l.status === status) : links;
  if (filtered.length === 0) return [];

  const parentIds = filtered.map((l) => l.parentId);
  const { profilesCol, usersCol } = await import("@/db/collections");
  const [pCol, uCol] = await Promise.all([profilesCol(), usersCol()]);
  const [profiles, users] = await Promise.all([
    pCol.find({ userId: { $in: parentIds } }).toArray(),
    uCol.find({ _id: { $in: parentIds } }).toArray(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

  return filtered.map((l) => {
    const idStr = l.parentId.toString();
    const p = profileMap.get(idStr);
    const u = userMap.get(idStr);
    return {
      id: l._id!.toString(),
      parentId: idStr,
      learnerId: l.learnerId.toString(),
      status: l.status,
      requestedBy: l.requestedBy,
      createdAt: l.createdAt,
      respondedAt: l.respondedAt,
      revokedAt: l.revokedAt,
      parentName: p?.name || u?.email.split("@")[0] || "Parent",
      parentEmail: u?.email,
    };
  });
}
