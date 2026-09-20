import { ObjectId } from "mongodb";
import { learningMaterialsCol } from "./collections";
import { LearningMaterial } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function createLearningMaterial(
  input: Omit<LearningMaterial, "_id">
): Promise<LearningMaterial> {
  const col = await learningMaterialsCol();
  const result = await col.insertOne(input as LearningMaterial);
  return { ...input, _id: result.insertedId };
}

export async function getLearningMaterialById(
  id: string | ObjectId
): Promise<LearningMaterial | null> {
  const col = await learningMaterialsCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function getLearningMaterialsByUploader(
  uploadedById: string | ObjectId
): Promise<LearningMaterial[]> {
  const col = await learningMaterialsCol();
  return col.find({ uploadedById: toObjectId(uploadedById) }).sort({ createdAt: -1 }).toArray();
}

export async function updateLearningMaterialProcessing(
  id: string | ObjectId,
  data: { extractedText?: string; chunks?: Record<string, unknown> }
): Promise<LearningMaterial | null> {
  const col = await learningMaterialsCol();
  const allowed: Partial<LearningMaterial> = {};
  if (data.extractedText !== undefined) allowed.extractedText = data.extractedText;
  if (data.chunks !== undefined) allowed.chunks = data.chunks;
  await col.updateOne({ _id: toObjectId(id) }, { $set: allowed });
  return getLearningMaterialById(id);
}
