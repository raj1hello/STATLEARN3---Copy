import { ObjectId } from "mongodb";
import { questionsCol } from "./collections";
import { Question } from "@/types";
import { toObjectId } from "@/lib/sanitize";

export async function getQuestionsByAssessment(
  assessmentId: string | ObjectId
): Promise<Question[]> {
  const col = await questionsCol();
  return col.find({ assessmentId: toObjectId(assessmentId) }).toArray();
}

export async function getQuestionById(id: string | ObjectId): Promise<Question | null> {
  const col = await questionsCol();
  return col.findOne({ _id: toObjectId(id) });
}

export async function insertQuestions(questions: Omit<Question, "_id">[]): Promise<ObjectId[]> {
  if (questions.length === 0) return [];
  const col = await questionsCol();
  const result = await col.insertMany(questions as Question[]);
  return Object.values(result.insertedIds);
}

export async function updateQuestion(
  id: string | ObjectId,
  data: Partial<Omit<Question, "_id" | "assessmentId">>
): Promise<Question | null> {
  const col = await questionsCol();
  const allowed: Partial<Question> = {};
  if (data.text !== undefined) allowed.text = data.text;
  if (data.type !== undefined) allowed.type = data.type;
  if (data.difficulty !== undefined) allowed.difficulty = data.difficulty;
  if (data.competencyId !== undefined) allowed.competencyId = data.competencyId;
  if (data.answers !== undefined) allowed.answers = data.answers;
  if (data.reviewedByTrainer !== undefined) allowed.reviewedByTrainer = data.reviewedByTrainer;

  await col.updateOne({ _id: toObjectId(id) }, { $set: allowed });
  return getQuestionById(id);
}

export async function deleteQuestion(id: string | ObjectId): Promise<boolean> {
  const col = await questionsCol();
  const result = await col.deleteOne({ _id: toObjectId(id) });
  return result.deletedCount === 1;
}

export async function deleteQuestionsByAssessment(
  assessmentId: string | ObjectId
): Promise<number> {
  const col = await questionsCol();
  const result = await col.deleteMany({ assessmentId: toObjectId(assessmentId) });
  return result.deletedCount;
}
