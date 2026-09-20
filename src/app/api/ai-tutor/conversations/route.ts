import { requireSession } from "@/lib/auth/session";
import { getConversationsByUser, createConversation } from "@/db/aiConversations";
import { sanitizeInput } from "@/lib/sanitize";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const conversations = await getConversationsByUser(session.userId);
    return ok({ conversations });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const rawBody: any = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);

    const title = (cleanBody.title as string)?.trim() || "New Statistical Inquiry";
    const initialMessages = Array.isArray(cleanBody.messages) ? cleanBody.messages : [];

    const conversation = await createConversation(session.userId, title, initialMessages);
    return ok({ conversation }, 201);
  } catch (error) {
    return handleError(error);
  }
}
