import { ObjectId } from "mongodb";
import { assessmentAttemptsCol } from "./collections";
import { AssessmentAttempt } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function createAttempt(
  input: Omit<AssessmentAttempt, "_id">
): Promise<AssessmentAttempt> {
  const col = await assessmentAttemptsCol();
  const result = await col.insertOne(input as AssessmentAttempt);
  return { ...input, _id: result.insertedId };
}

export async function getAttemptsByUser(
  userId: string | ObjectId
): Promise<AssessmentAttempt[]> {
  const col = await assessmentAttemptsCol();
  return col.find({ userId: toObjectId(userId) }).sort({ startedAt: -1 }).toArray();
}

export async function getAttemptsByUserAndAssessment(
  userId: string | ObjectId,
  assessmentId: string | ObjectId
): Promise<AssessmentAttempt[]> {
  const col = await assessmentAttemptsCol();
  return col
    .find({ userId: toObjectId(userId), assessmentId: toObjectId(assessmentId) })
    .sort({ startedAt: 1 })
    .toArray();
}

export async function getAttemptById(id: string | ObjectId): Promise<AssessmentAttempt | null> {
  const col = await assessmentAttemptsCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function getLatestAttempt(
  userId: string | ObjectId,
  assessmentId: string | ObjectId
): Promise<AssessmentAttempt | null> {
  const col = await assessmentAttemptsCol();
  return col.findOne(
    { userId: toObjectId(userId), assessmentId: toObjectId(assessmentId) },
    { sort: { startedAt: -1 } }
  );
}

export async function getAllAttempts(): Promise<AssessmentAttempt[]> {
  const col = await assessmentAttemptsCol();
  return col.find({}).toArray();
}
