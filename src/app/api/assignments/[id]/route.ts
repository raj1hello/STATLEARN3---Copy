import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getAssignmentById, updateAssignmentStatus, deleteAssignment } from "@/db/assignments";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput } from "@/lib/sanitize";

const UpdateAssignmentSchema = z.object({
  status: z.enum(["new", "in_progress", "completed"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid assignment ID format", 400);
    }

    const assignment = await getAssignmentById(id);
    if (!assignment) {
      return fail("NOT_FOUND", "Assignment not found", 404);
    }

    // Role check: learner can update their own assignment (e.g. mark in_progress or completed)
    // Trainer can also update status of assignments they created
    const isLearnerOwner = assignment.learnerId.toString() === session.userId;
    const isTrainerOwner = assignment.assignedBy.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isLearnerOwner && !isTrainerOwner && !isAdmin) {
      return fail("FORBIDDEN", "You do not have permission to update this assignment", 403);
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = UpdateAssignmentSchema.parse(cleanBody);

    const updated = await updateAssignmentStatus(id, parsed.status);
    return ok({ message: `Assignment marked as ${parsed.status}`, assignment: updated });
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

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid assignment ID format", 400);
    }

    const assignment = await getAssignmentById(id);
    if (!assignment) {
      return fail("NOT_FOUND", "Assignment not found", 404);
    }

    // Only the assigning trainer or admin can delete an assignment
    const isTrainerOwner = assignment.assignedBy.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isTrainerOwner && !isAdmin) {
      return fail("FORBIDDEN", "You can only delete assignments you created", 403);
    }

    const deleted = await deleteAssignment(id);
    return ok({ success: deleted, message: "Assignment deleted" });
  } catch (error) {
    return handleError(error);
  }
}
