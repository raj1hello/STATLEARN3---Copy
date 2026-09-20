import { ObjectId } from "mongodb";
import { parentLinksCol } from "./collections";
import { ParentLink, ParentLinkStatus } from "@/types";
import { toObjectId } from "@/lib/sanitize";

/**
 * Parent / Guardian ↔ Learner linking.
 *
 * Parent access is authorized entirely server-side through these links:
 * a parent can only ever read data for learners whose id appears in an
 * "active" parent_links row pointing at that parent. Changing a learner id
 * in the URL cannot expose another learner's report.
 *
 * Lifecycle (mirrors the trainer↔learner `connections` approval model):
 *   pending   — parent (or admin) requested the link; waiting for the learner.
 *   active    — learner approved the request, OR an admin bootstrapped the
 *               link directly. ONLY "active" links grant parent read access.
 *   rejected  — learner declined the request; the parent may re-request.
 *   revoked   — parent cancelled a pending/active request, or admin removed it.
 */

export async function createParentLink(input: {
  parentId: ObjectId;
  learnerId: ObjectId;
  status?: ParentLinkStatus;
  requestedBy?: "parent" | "admin" | "learner";
}): Promise<ParentLink> {
  const col = await parentLinksCol();
  const doc: ParentLink = {
    parentId: input.parentId,
    learnerId: input.learnerId,
    status: input.status ?? "active",
    requestedBy: input.requestedBy,
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getParentLinkById(
  id: string | ObjectId
): Promise<ParentLink | null> {
  const col = await parentLinksCol();
  return col.findOne({ _id: toObjectId(id) });
}

/**
 * The most recent link between a pair, across ALL statuses. Used for dedupe
 * and for "re-request after rejection" (a rejected link flips back to pending
 * instead of creating a duplicate row).
 */
export async function getParentLinkByPair(
  parentId: string | ObjectId,
  learnerId: string | ObjectId
): Promise<ParentLink | null> {
  const col = await parentLinksCol();
  return col
    .find({
      parentId: toObjectId(parentId),
      learnerId: toObjectId(learnerId),
    })
    .sort({ createdAt: -1 })
    .toArray()
    .then((rows) => rows[0] || null);
}

/**
 * All (active) learners linked to a parent. Returns the learner ids only.
 * Kept active-only: the parent report + switcher depend on it.
 */
export async function listLinkedLearnerIds(
  parentId: string | ObjectId
): Promise<ObjectId[]> {
  const col = await parentLinksCol();
  const rows = await col
    .find({ parentId: toObjectId(parentId), status: "active" })
    .sort({ createdAt: 1 })
    .toArray();
  return rows.map((r) => r.learnerId);
}

/**
 * Whether `learnerId` is an active link of `parentId`. The single source of
 * truth used by every parent-facing read to reject cross-learner access.
 */
export async function isLearnerLinkedToParent(
  parentId: string | ObjectId,
  learnerId: string | ObjectId
): Promise<boolean> {
  const col = await parentLinksCol();
  const found = await col.findOne({
    parentId: toObjectId(parentId),
    learnerId: toObjectId(learnerId),
    status: "active",
  });
  return found !== null;
}

/**
 * All links belonging to a parent (any status) — for the parent's own
 * "Link Learner" management UI (show pending / active, allow revoke/cancel).
 */
export async function listParentLinksForParent(
  parentId: string | ObjectId
): Promise<ParentLink[]> {
  const col = await parentLinksCol();
  return col
    .find({ parentId: toObjectId(parentId) })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Incoming links for a learner (any status) — for the learner's approval UI.
 */
export async function listParentLinksForLearner(
  learnerId: string | ObjectId
): Promise<ParentLink[]> {
  const col = await parentLinksCol();
  return col
    .find({ learnerId: toObjectId(learnerId) })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Learner responds to a pending parent link. Only the learner on the link may
 * approve/decline; this is enforced by the ownership check in the route.
 * Approval ("accepted") activates the link and grants the parent read access.
 */
export async function respondToParentLink(
  id: string | ObjectId,
  status: "accepted" | "rejected"
): Promise<ParentLink | null> {
  const col = await parentLinksCol();
  await col.updateOne(
    { _id: toObjectId(id) },
    {
      $set: {
        status: status === "accepted" ? "active" : "rejected",
        respondedAt: new Date(),
        revokedAt: undefined,
      },
    }
  );
  return getParentLinkById(id);
}

/**
 * Parent cancels a pending request or revokes an active link; admin may also
 * call this to remove a link for either side. Any non-terminal status can be
 * revoked (pending / active / rejected); revoked is terminal.
 */
export async function revokeParentLink(
  id: string | ObjectId
): Promise<boolean> {
  const col = await parentLinksCol();
  const result = await col.updateOne(
    { _id: toObjectId(id), status: { $in: ["pending", "active", "rejected"] } },
    { $set: { status: "revoked", revokedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}
