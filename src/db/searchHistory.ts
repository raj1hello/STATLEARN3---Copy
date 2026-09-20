import { ObjectId } from "mongodb";
import { searchHistoryCol } from "./collections";
import { SearchHistory } from "@/types";
import { toObjectId } from "@/lib/sanitize";

/**
 * Record a search query for the authenticated user.
 */
export async function recordSearch(
  userId: string | ObjectId,
  query: string,
  category?: string
): Promise<SearchHistory> {
  const col = await searchHistoryCol();
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Search query cannot be empty");
  }

  // Remove existing duplicate recent search if present to keep history clean and fresh
  await col.deleteMany({
    userId: toObjectId(userId),
    query: { $regex: `^${trimmed}$`, $options: "i" },
  });

  const doc: SearchHistory = {
    userId: toObjectId(userId),
    query: trimmed,
    category: category || "global",
    createdAt: new Date(),
  };

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * Get search history for a user, sorted newest first.
 */
export async function getSearchHistory(
  userId: string | ObjectId,
  limit: number = 30
): Promise<SearchHistory[]> {
  const col = await searchHistoryCol();
  return col
    .find({ userId: toObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Delete a single search entry belonging to the user.
 */
export async function deleteSearchEntry(
  userId: string | ObjectId,
  entryId: string | ObjectId
): Promise<boolean> {
  const col = await searchHistoryCol();
  const res = await col.deleteOne({
    _id: toObjectId(entryId),
    userId: toObjectId(userId),
  });
  return res.deletedCount > 0;
}

/**
 * Clear all search history for a user.
 */
export async function clearUserSearchHistory(
  userId: string | ObjectId
): Promise<number> {
  const col = await searchHistoryCol();
  const res = await col.deleteMany({
    userId: toObjectId(userId),
  });
  return res.deletedCount;
}
