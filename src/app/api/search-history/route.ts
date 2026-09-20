import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { recordSearch, getSearchHistory, clearUserSearchHistory } from "@/db/searchHistory";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/sanitize";

const RecordSearchSchema = z.object({
  query: z.string().min(1).max(200),
  category: z.string().max(50).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const history = await getSearchHistory(session.userId);
    return ok(history);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = RecordSearchSchema.parse(cleanBody);

    const entry = await recordSearch(session.userId, parsed.query, parsed.category);
    return ok(entry);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession(request);
    const count = await clearUserSearchHistory(session.userId);
    return ok({ message: "Search history cleared", clearedCount: count });
  } catch (error) {
    return handleError(error);
  }
}
