import { ObjectId } from "mongodb";
import { competenciesCol } from "./collections";
import { Competency } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function listCompetencies(): Promise<Competency[]> {
  const col = await competenciesCol();
  return col.find({}).sort({ name: 1 }).toArray();
}

export async function getCompetencyById(id: string | ObjectId): Promise<Competency | null> {
  const col = await competenciesCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function createCompetency(input: Omit<Competency, "_id">): Promise<Competency> {
  const col = await competenciesCol();
  const result = await col.insertOne(input as Competency);
  return { ...input, _id: result.insertedId };
}

export async function getCompetenciesByIds(ids: ObjectId[]): Promise<Competency[]> {
  if (ids.length === 0) return [];
  const col = await competenciesCol();
  return col.find({ _id: { $in: ids } }).toArray();
}

export async function getCompetencyByName(name: string): Promise<Competency | null> {
  const col = await competenciesCol();
  return col.findOne({ name });
}
