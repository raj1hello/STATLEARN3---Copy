import { ObjectId } from "mongodb";
import { aiConversationsCol } from "./collections";
import { AiConversation, AiChatMessage } from "@/types";
import { sanitizeInput, toObjectId } from "@/lib/sanitize";

export async function getConversationsByUser(userId: ObjectId | string): Promise<AiConversation[]> {
  const col = await aiConversationsCol();
  const validUserId = toObjectId(userId);
  if (!validUserId) return [];

  const filter = sanitizeInput({ userId: validUserId });
  return col.find(filter).sort({ updatedAt: -1 }).toArray();
}

export async function getConversationById(
  id: ObjectId | string,
  userId: ObjectId | string
): Promise<AiConversation | null> {
  const col = await aiConversationsCol();
  const validId = toObjectId(id);
  const validUserId = toObjectId(userId);
  if (!validId || !validUserId) return null;

  const filter = sanitizeInput({ _id: validId, userId: validUserId });
  return col.findOne(filter);
}

export async function createConversation(
  userId: ObjectId | string,
  title: string,
  initialMessages: AiChatMessage[] = []
): Promise<AiConversation | null> {
  const col = await aiConversationsCol();
  const validUserId = toObjectId(userId);
  if (!validUserId) return null;

  const now = new Date();
  const doc: AiConversation = {
    userId: validUserId,
    title,
    messages: initialMessages,
    createdAt: now,
    updatedAt: now,
  };

  const res = await col.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function addMessageToConversation(
  conversationId: ObjectId | string,
  userId: ObjectId | string,
  message: AiChatMessage,
  updatedTitle?: string
): Promise<boolean> {
  const col = await aiConversationsCol();
  const validId = toObjectId(conversationId);
  const validUserId = toObjectId(userId);
  if (!validId || !validUserId) return false;

  const filter = sanitizeInput({ _id: validId, userId: validUserId });
  const updateObj: Record<string, any> = {
    $push: { messages: message },
    $set: { updatedAt: new Date() },
  };

  if (updatedTitle) {
    updateObj.$set.title = updatedTitle;
  }

  const res = await col.updateOne(filter, updateObj);
  return res.modifiedCount > 0;
}

export async function deleteConversation(
  conversationId: ObjectId | string,
  userId: ObjectId | string
): Promise<boolean> {
  const col = await aiConversationsCol();
  const validId = toObjectId(conversationId);
  const validUserId = toObjectId(userId);
  if (!validId || !validUserId) return false;

  const filter = sanitizeInput({ _id: validId, userId: validUserId });
  const res = await col.deleteOne(filter);
  return res.deletedCount > 0;
}
