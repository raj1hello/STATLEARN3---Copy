import { ObjectId } from "mongodb";
import { assignmentsCol } from "./collections";
import { Assignment, AssignmentContent, AssignmentStatus } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export interface AssignmentInput {
  assignedBy: ObjectId;
  learnerId: ObjectId;
  content: AssignmentContent;
  status?: AssignmentStatus;
  dueAt?: Date;
  message?: string;
}

export async function createAssignment(input: AssignmentInput): Promise<Assignment> {
  const col = await assignmentsCol();
  const doc: Assignment = {
    assignedBy: input.assignedBy,
    learnerId: input.learnerId,
    content: input.content,
    status: input.status ?? "new",
    dueAt: input.dueAt,
    assignedAt: new Date(),
    message: input.message,
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getAssignmentById(id: string | ObjectId): Promise<Assignment | null> {
  const col = await assignmentsCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function listAssignmentsForLearner(
  learnerId: string | ObjectId
): Promise<Assignment[]> {
  const col = await assignmentsCol();
  return col
    .find({ learnerId: toObjectId(learnerId) })
    .sort({ assignedAt: -1 })
    .toArray();
}

export async function listAssignmentsByTrainer(
  assignedBy: string | ObjectId,
  learnerId?: string | ObjectId
): Promise<Assignment[]> {
  const col = await assignmentsCol();
  const query: Record<string, unknown> = { assignedBy: toObjectId(assignedBy) };
  if (learnerId) query.learnerId = toObjectId(learnerId);
  return col.find(query).sort({ assignedAt: -1 }).toArray();
}

export async function updateAssignmentStatus(
  id: string | ObjectId,
  status: AssignmentStatus
): Promise<Assignment | null> {
  const col = await assignmentsCol();
  const updateDoc: Record<string, unknown> = { status };
  if (status === "in_progress") {
    updateDoc.startedAt = new Date();
  } else if (status === "completed") {
    updateDoc.completedAt = new Date();
  }
  await col.updateOne({ _id: toObjectId(id) }, { $set: updateDoc });
  return getAssignmentById(id);
}

export async function createMultipleAssignments(input: {
  assignedBy: ObjectId;
  learnerIds: ObjectId[];
  content: AssignmentContent;
  dueAt?: Date;
  message?: string;
}): Promise<Assignment[]> {
  if (input.learnerIds.length === 0) return [];
  const col = await assignmentsCol();
  const now = new Date();
  const docs: Assignment[] = input.learnerIds.map((lId) => ({
    assignedBy: input.assignedBy,
    learnerId: lId,
    content: input.content,
    status: "new",
    dueAt: input.dueAt,
    assignedAt: now,
    message: input.message,
  }));

  const result = await col.insertMany(docs);
  return docs.map((d, idx) => ({ ...d, _id: result.insertedIds[idx] }));
}

export interface EnrichedLearnerAssignment extends Assignment {
  trainerName: string;
  trainerEmail?: string;
}

export async function listEnrichedAssignmentsForLearner(
  learnerId: string | ObjectId,
  status?: AssignmentStatus
): Promise<EnrichedLearnerAssignment[]> {
  const col = await assignmentsCol();
  const query: Record<string, unknown> = { learnerId: toObjectId(learnerId) };
  if (status) query.status = status;
  const items = await col.find(query).sort({ assignedAt: -1 }).toArray();

  if (items.length === 0) return [];

  const trainerIds = Array.from(new Set(items.map((i) => i.assignedBy.toString()))).map((id) =>
    toObjectId(id)
  );

  const { profilesCol, usersCol } = await import("./collections");
  const [pCol, uCol] = await Promise.all([profilesCol(), usersCol()]);

  const [profiles, users] = await Promise.all([
    pCol.find({ userId: { $in: trainerIds } }).toArray(),
    uCol.find({ _id: { $in: trainerIds } }).toArray(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

  return items.map((item) => {
    const tId = item.assignedBy.toString();
    const p = profileMap.get(tId);
    const u = userMap.get(tId);
    return {
      ...item,
      trainerName: p?.name || u?.email?.split("@")[0] || "Trainer",
      trainerEmail: u?.email,
    };
  });
}

export interface EnrichedTrainerAssignment extends Assignment {
  learnerName: string;
  learnerEmail?: string;
  learnerStream?: string;
}

export async function listEnrichedAssignmentsByTrainer(
  assignedBy: string | ObjectId,
  learnerId?: string | ObjectId
): Promise<EnrichedTrainerAssignment[]> {
  const col = await assignmentsCol();
  const query: Record<string, unknown> = { assignedBy: toObjectId(assignedBy) };
  if (learnerId) query.learnerId = toObjectId(learnerId);
  const items = await col.find(query).sort({ assignedAt: -1 }).toArray();

  if (items.length === 0) return [];

  const learnerIds = Array.from(new Set(items.map((i) => i.learnerId.toString()))).map((id) =>
    toObjectId(id)
  );

  const { profilesCol, usersCol } = await import("./collections");
  const [pCol, uCol] = await Promise.all([profilesCol(), usersCol()]);

  const [profiles, users] = await Promise.all([
    pCol.find({ userId: { $in: learnerIds } }).toArray(),
    uCol.find({ _id: { $in: learnerIds } }).toArray(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

  return items.map((item) => {
    const lId = item.learnerId.toString();
    const p = profileMap.get(lId);
    const u = userMap.get(lId);
    return {
      ...item,
      learnerName: p?.name || u?.email?.split("@")[0] || "Learner",
      learnerEmail: u?.email,
      learnerStream: p?.stream,
    };
  });
}

export async function markAssignmentAttempt(
  learnerId: string | ObjectId,
  refId: string | ObjectId,
  status: "in_progress" | "completed"
): Promise<void> {
  const col = await assignmentsCol();
  const updateDoc: Record<string, unknown> = { status };
  if (status === "in_progress") {
    // Only set startedAt if not set, and only change if status is new
    await col.updateMany(
      {
        learnerId: toObjectId(learnerId),
        "content.refId": toObjectId(refId),
        status: "new",
      },
      {
        $set: { status: "in_progress", startedAt: new Date() },
      }
    );
  } else if (status === "completed") {
    await col.updateMany(
      {
        learnerId: toObjectId(learnerId),
        "content.refId": toObjectId(refId),
      },
      {
        $set: { status: "completed", completedAt: new Date() },
      }
    );
  }
}

export async function deleteAssignment(id: string | ObjectId): Promise<boolean> {
  const col = await assignmentsCol();
  const result = await col.deleteOne({ _id: toObjectId(id) });
  return result.deletedCount > 0;
}

export async function hasAssignedMaterialToLearner(
  materialId: string | ObjectId,
  learnerId: string | ObjectId
): Promise<boolean> {
  const col = await assignmentsCol();
  const found = await col.findOne({
    learnerId: toObjectId(learnerId),
    "content.type": "material",
    "content.refId": toObjectId(materialId),
  });
  return found !== null;
}

