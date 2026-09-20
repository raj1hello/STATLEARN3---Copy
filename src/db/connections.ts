import { ObjectId } from "mongodb";
import { connectionsCol } from "./collections";
import { Connection, ConnectionStatus } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function createConnectionRequest(input: {
  trainerId: ObjectId;
  learnerId: ObjectId;
  requestMessage?: string;
  senderName?: string;
}): Promise<Connection> {
  const col = await connectionsCol();
  const doc: Connection = {
    trainerId: input.trainerId,
    learnerId: input.learnerId,
    status: "pending",
    requestedBy: "learner",
    requestMessage: input.requestMessage,
    senderName: input.senderName,
    createdAt: new Date(),
  };
  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getConnectionById(id: string | ObjectId): Promise<Connection | null> {
  const col = await connectionsCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function getConnectionByPair(
  trainerId: string | ObjectId,
  learnerId: string | ObjectId
): Promise<Connection | null> {
  const col = await connectionsCol();
  return col.findOne({
    trainerId: toObjectId(trainerId),
    learnerId: toObjectId(learnerId),
  });
}

export async function hasAcceptedConnection(
  trainerId: string | ObjectId,
  learnerId: string | ObjectId
): Promise<boolean> {
  const col = await connectionsCol();
  const found = await col.findOne({
    trainerId: toObjectId(trainerId),
    learnerId: toObjectId(learnerId),
    status: "accepted",
  });
  return found !== null;
}

export async function listIncomingConnections(
  trainerId: string | ObjectId,
  status?: ConnectionStatus
): Promise<Connection[]> {
  const col = await connectionsCol();
  const query: Record<string, unknown> = { trainerId: toObjectId(trainerId) };
  if (status) query.status = status;
  return col.find(query).sort({ createdAt: -1 }).toArray();
}

export async function listOutgoingConnections(
  learnerId: string | ObjectId,
  status?: ConnectionStatus
): Promise<Connection[]> {
  const col = await connectionsCol();
  const query: Record<string, unknown> = { learnerId: toObjectId(learnerId) };
  if (status) query.status = status;
  return col.find(query).sort({ createdAt: -1 }).toArray();
}

export async function respondToConnection(
  id: string | ObjectId,
  status: "accepted" | "rejected"
): Promise<Connection | null> {
  const col = await connectionsCol();
  await col.updateOne(
    { _id: toObjectId(id) },
    { $set: { status, respondedAt: new Date() } }
  );
  return getConnectionById(id);
}

export async function listAcceptedTrainerIds(learnerId: string | ObjectId): Promise<ObjectId[]> {
  const col = await connectionsCol();
  const rows = await col
    .find({ learnerId: toObjectId(learnerId), status: "accepted" })
    .toArray();
  return rows.map((r) => r.trainerId);
}

export async function listAcceptedLearnerIds(trainerId: string | ObjectId): Promise<ObjectId[]> {
  const col = await connectionsCol();
  const rows = await col
    .find({ trainerId: toObjectId(trainerId), status: "accepted" })
    .toArray();
  return rows.map((r) => r.learnerId);
}

export interface EnrichedIncomingConnection extends Connection {
  learnerName: string;
  learnerEmail?: string;
  learnerStream?: string;
  learnerSkills?: string[];
  learnerDesignation?: string;
}

export async function listEnrichedIncomingConnections(
  trainerId: string | ObjectId,
  status?: ConnectionStatus
): Promise<EnrichedIncomingConnection[]> {
  const connections = await listIncomingConnections(trainerId, status);
  if (connections.length === 0) return [];

  const learnerIds = connections.map((c) => c.learnerId);
  const { profilesCol, usersCol } = await import("./collections");
  const [pCol, uCol] = await Promise.all([profilesCol(), usersCol()]);

  const [profiles, users] = await Promise.all([
    pCol.find({ userId: { $in: learnerIds } }).toArray(),
    uCol.find({ _id: { $in: learnerIds } }).toArray(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

  return connections.map((c) => {
    const lIdStr = c.learnerId.toString();
    const p = profileMap.get(lIdStr);
    const u = userMap.get(lIdStr);
    return {
      ...c,
      learnerName: p?.name || c.senderName || u?.email.split("@")[0] || "Learner",
      learnerEmail: u?.email,
      learnerStream: p?.stream,
      learnerSkills: p?.existingSkills || [],
      learnerDesignation: p?.designation,
    };
  });
}

export interface EnrichedOutgoingConnection extends Connection {
  trainerName: string;
  trainerEmail?: string;
  trainerStream?: string;
  trainerDesignation?: string;
  trainerDepartment?: string;
}

export async function listEnrichedOutgoingConnections(
  learnerId: string | ObjectId,
  status?: ConnectionStatus
): Promise<EnrichedOutgoingConnection[]> {
  const connections = await listOutgoingConnections(learnerId, status);
  if (connections.length === 0) return [];

  const trainerIds = connections.map((c) => c.trainerId);
  const { profilesCol, usersCol } = await import("./collections");
  const [pCol, uCol] = await Promise.all([profilesCol(), usersCol()]);

  const [profiles, users] = await Promise.all([
    pCol.find({ userId: { $in: trainerIds } }).toArray(),
    uCol.find({ _id: { $in: trainerIds } }).toArray(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

  return connections.map((c) => {
    const tIdStr = c.trainerId.toString();
    const p = profileMap.get(tIdStr);
    const u = userMap.get(tIdStr);
    return {
      ...c,
      trainerName: p?.name || u?.email.split("@")[0] || "Trainer",
      trainerEmail: u?.email,
      trainerStream: p?.stream,
      trainerDesignation: p?.designation,
      trainerDepartment: p?.department,
    };
  });
}

export interface ConnectedLearnerInfo {
  learnerId: string;
  connectionId: string;
  connectedAt: Date;
  name: string;
  email: string;
  stream?: string;
  skills: string[];
  designation?: string;
  department?: string;
  activeAssignmentsCount?: number;
}

export async function listConnectedLearners(
  trainerId: string | ObjectId
): Promise<ConnectedLearnerInfo[]> {
  const col = await connectionsCol();
  const acceptedConns = await col
    .find({ trainerId: toObjectId(trainerId), status: "accepted" })
    .sort({ respondedAt: -1, createdAt: -1 })
    .toArray();

  if (acceptedConns.length === 0) return [];

  const learnerIds = acceptedConns.map((c) => c.learnerId);
  const { profilesCol, usersCol, assignmentsCol } = await import("./collections");
  const [pCol, uCol, aCol] = await Promise.all([profilesCol(), usersCol(), assignmentsCol()]);

  const [profiles, users, assignments] = await Promise.all([
    pCol.find({ userId: { $in: learnerIds } }).toArray(),
    uCol.find({ _id: { $in: learnerIds } }).toArray(),
    aCol
      .find({
        assignedBy: toObjectId(trainerId),
        learnerId: { $in: learnerIds },
        status: { $in: ["new", "in_progress"] },
      })
      .toArray(),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const userMap = new Map(users.map((u) => [u._id!.toString(), u]));

  const activeCountMap = new Map<string, number>();
  for (const a of assignments) {
    const idStr = a.learnerId.toString();
    activeCountMap.set(idStr, (activeCountMap.get(idStr) || 0) + 1);
  }

  return acceptedConns.map((c) => {
    const lIdStr = c.learnerId.toString();
    const p = profileMap.get(lIdStr);
    const u = userMap.get(lIdStr);
    return {
      learnerId: lIdStr,
      connectionId: c._id!.toString(),
      connectedAt: c.respondedAt || c.createdAt,
      name: p?.name || c.senderName || u?.email.split("@")[0] || "Learner",
      email: u?.email || "",
      stream: p?.stream,
      skills: p?.existingSkills || [],
      designation: p?.designation,
      department: p?.department,
      activeAssignmentsCount: activeCountMap.get(lIdStr) || 0,
    };
  });
}

