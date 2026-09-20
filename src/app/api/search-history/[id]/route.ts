import { requireSession } from "@/lib/auth/session";
import { deleteSearchEntry } from "@/db/searchHistory";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId } from "@/lib/sanitize";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid search history entry ID format", 400);
    }

    const deleted = await deleteSearchEntry(session.userId, id);
    if (!deleted) {
      return fail("NOT_FOUND", "Search history entry not found or unauthorized", 404);
    }

    return ok({ message: "Search entry deleted", id });
  } catch (error) {
    return handleError(error);
  }
}
