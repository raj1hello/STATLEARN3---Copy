import { ObjectId } from "mongodb";
import { userNotesCol } from "./collections";
import { UserNote } from "@/types";
import { sanitizeInput, toObjectId } from "@/lib/sanitize";

export async function getUserNotes(userId: ObjectId | string): Promise<UserNote[]> {
  const col = await userNotesCol();
  const validUserId = toObjectId(userId);
  if (!validUserId) return [];

  const filter = sanitizeInput({ userId: validUserId });
  return col.find(filter).sort({ updatedAt: -1 }).toArray();
}

export async function getUserNoteById(
  id: ObjectId | string,
  userId: ObjectId | string
): Promise<UserNote | null> {
  const col = await userNotesCol();
  const validId = toObjectId(id);
  const validUserId = toObjectId(userId);
  if (!validId || !validUserId) return null;

  const filter = sanitizeInput({ _id: validId, userId: validUserId });
  return col.findOne(filter);
}

export async function createUserNote(
  userId: ObjectId | string,
  data: {
    title: string;
    topic?: string;
    summary: string;
    keyPoints: string[];
    practicalTakeaways?: string[];
    markdownContent: string;
    conversationId?: ObjectId | string;
  }
): Promise<UserNote | null> {
  const col = await userNotesCol();
  const validUserId = toObjectId(userId);
  if (!validUserId) return null;

  const now = new Date();
  const doc: UserNote = {
    userId: validUserId,
    title: data.title,
    topic: data.topic,
    summary: data.summary,
    keyPoints: data.keyPoints,
    practicalTakeaways: data.practicalTakeaways,
    markdownContent: data.markdownContent,
    conversationId: data.conversationId ? toObjectId(data.conversationId) : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const res = await col.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}
