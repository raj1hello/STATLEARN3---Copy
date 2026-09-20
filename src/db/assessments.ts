import { ObjectId } from "mongodb";
import { assessmentsCol } from "./collections";
import { Assessment } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function listAssessments(filter: {
  publishedOnly?: boolean;
  createdById?: string | ObjectId;
  competencyId?: string | ObjectId;
  learnerUserId?: string | ObjectId;
  kind?: "assessment" | "quiz" | "stream_test";
  stream?: string;
}): Promise<Assessment[]> {
  const col = await assessmentsCol();
  const query: Record<string, unknown> = {};
  if (filter.publishedOnly) query.published = true;
  if (filter.createdById) query.createdById = toObjectId(filter.createdById);
  if (filter.competencyId) query.competencyId = toObjectId(filter.competencyId);
  if (filter.stream && filter.stream !== "all") query.stream = filter.stream;

  // Filter by kind discriminator if provided
  if (filter.kind === "quiz") {
    query.kind = "quiz";
  } else if (filter.kind === "stream_test") {
    query.kind = "stream_test";
  } else if (filter.kind === "assessment") {
    query.kind = { $in: ["assessment", null, undefined] };
  }

  if (filter.learnerUserId) {
    const userIdObj = toObjectId(filter.learnerUserId);
    query.$or = [
      { isOfficial: true },
      { createdById: userIdObj }
    ];
  }

  return col.find(query).sort({ createdAt: -1 }).toArray();
}

export async function getAssessmentById(id: string | ObjectId): Promise<Assessment | null> {
  const col = await assessmentsCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function createAssessment(input: Omit<Assessment, "_id">): Promise<Assessment> {
  const col = await assessmentsCol();
  const result = await col.insertOne(input as Assessment);
  return { ...input, _id: result.insertedId };
}

export async function updateAssessment(
  id: string | ObjectId,
  data: Partial<Omit<Assessment, "_id" | "createdById">>
): Promise<Assessment | null> {
  const col = await assessmentsCol();
  await col.updateOne(
    { _id: toObjectId(id) },
    { $set: data }
  );
  return getAssessmentById(id);
}

export async function deleteAssessment(id: string | ObjectId): Promise<boolean> {
  const col = await assessmentsCol();
  const result = await col.deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

export async function publishAssessment(id: string | ObjectId): Promise<Assessment | null> {
  const col = await assessmentsCol();
  await col.updateOne({ _id: toObjectId(id) }, { $set: { published: true } });
  return getAssessmentById(id);
}

export async function countPublishedAssessments(): Promise<number> {
  const col = await assessmentsCol();
  return col.countDocuments({ published: true });
}
