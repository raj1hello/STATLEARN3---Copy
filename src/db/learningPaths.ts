import { ObjectId } from "mongodb";
import { learningPathsCol } from "./collections";
import { LearningPath } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function getLearningPathsByUser(
  userId: string | ObjectId
): Promise<LearningPath[]> {
  const col = await learningPathsCol();
  return col.find({ userId: toObjectId(userId) }).toArray();
}

export async function getLearningPathById(
  id: string | ObjectId
): Promise<LearningPath | null> {
  const col = await learningPathsCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function createLearningPath(
  input: Omit<LearningPath, "_id">
): Promise<LearningPath> {
  const col = await learningPathsCol();
  const result = await col.insertOne(input as LearningPath);
  return { ...input, _id: result.insertedId };
}

export async function updateLearningPath(
  id: string | ObjectId,
  data: Partial<Pick<LearningPath, "weeks" | "status">>
): Promise<LearningPath | null> {
  const col = await learningPathsCol();
  const allowed: Partial<LearningPath> = {};
  if (data.weeks !== undefined) allowed.weeks = data.weeks;
  if (data.status !== undefined) allowed.status = data.status;
  await col.updateOne({ _id: toObjectId(id) }, { $set: allowed });
  return getLearningPathById(id);
}
