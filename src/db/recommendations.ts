import { ObjectId } from "mongodb";
import { recommendationsCol } from "./collections";
import { Recommendation } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function getRecommendationsByUser(
  userId: string | ObjectId
): Promise<Recommendation[]> {
  const col = await recommendationsCol();
  return col.find({ userId: toObjectId(userId) }).toArray();
}

export async function createRecommendation(
  input: Omit<Recommendation, "_id">
): Promise<Recommendation> {
  const col = await recommendationsCol();
  const result = await col.insertOne(input as Recommendation);
  return { ...input, _id: result.insertedId };
}

export async function replaceUserRecommendations(
  userId: string | ObjectId,
  recommendations: Omit<Recommendation, "_id" | "userId">[]
): Promise<Recommendation[]> {
  const col = await recommendationsCol();
  const uid = toObjectId(userId);
  await col.deleteMany({ userId: uid });
  if (recommendations.length === 0) return [];
  const docs: Recommendation[] = recommendations.map((r) => ({
    userId: uid,
    courseId: r.courseId,
    reason: r.reason,
  }));
  const result = await col.insertMany(docs);
  return docs.map((d, i) => ({ ...d, _id: result.insertedIds[i]! }));
}

export async function getAllRecommendations(): Promise<Recommendation[]> {
  const col = await recommendationsCol();
  return col.find({}).toArray();
}
