import { requireSession } from "@/lib/auth/session";
import {
  getConversationById,
  addMessageToConversation,
  deleteConversation,
} from "@/db/aiConversations";
import { sanitizeInput } from "@/lib/sanitize";
import { ok, handleError, Errors, fail } from "@/lib/apiResponse";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const conversation = await getConversationById(id, session.userId);
    if (!conversation) {
      throw Errors.notFound();
    }

    return ok({ conversation });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const rawBody: any = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);

    const message = cleanBody.message;
    if (!message || !message.text) {
      return fail("VALIDATION_ERROR", "Message text is required", 400);
    }

    const updatedTitle = (cleanBody.updatedTitle as string)?.trim();
    const success = await addMessageToConversation(id, session.userId, message, updatedTitle);
    if (!success) {
      throw Errors.notFound();
    }

    return ok({ updated: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;
    const deleted = await deleteConversation(id, session.userId);
    if (!deleted) {
      throw Errors.notFound();
    }

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
