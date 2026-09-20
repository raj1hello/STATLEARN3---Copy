import { ObjectId } from "mongodb";
import { progressCol } from "./collections";
import { Progress } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function recordProgress(input: Omit<Progress, "_id">): Promise<Progress> {
  const col = await progressCol();
  const result = await col.insertOne(input as Progress);
  return { ...input, _id: result.insertedId };
}

export async function getProgressByUser(userId: string | ObjectId): Promise<Progress[]> {
  const col = await progressCol();
  return col.find({ userId: toObjectId(userId) }).sort({ recordedAt: -1 }).toArray();
}

export async function getAllProgress(): Promise<Progress[]> {
  const col = await progressCol();
  return col.find({}).toArray();
}
