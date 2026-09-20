import { ObjectId } from "mongodb";
import { coursesCol } from "./collections";
import { Course } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function listCourses(filter: {
  source?: "mock_igot" | "igot";
  competencyId?: string | ObjectId;
}): Promise<Course[]> {
  const col = await coursesCol();
  const query: Record<string, unknown> = {};
  if (filter.source) query.source = filter.source;
  if (filter.competencyId) query.competencyId = toObjectId(filter.competencyId);
  return col.find(query).sort({ title: 1 }).toArray();
}

export async function getCourseById(id: string | ObjectId): Promise<Course | null> {
  const col = await coursesCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function createCourse(input: Omit<Course, "_id">): Promise<Course> {
  const col = await coursesCol();
  const doc: Course = { ...input, source: input.source || "mock_igot" };
  const result = await col.insertOne(doc as Course);
  return { ...doc, _id: result.insertedId };
}

export async function getCoursesByCompetencyIds(ids: ObjectId[]): Promise<Course[]> {
  if (ids.length === 0) return [];
  const col = await coursesCol();
  return col.find({ competencyId: { $in: ids } }).toArray();
}
