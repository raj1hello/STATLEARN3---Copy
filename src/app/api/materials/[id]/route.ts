import { requireSession } from "@/lib/auth/session";
import { getLearningMaterialById } from "@/db/learningMaterials";
import { hasAssignedMaterialToLearner } from "@/db/assignments";
import { hasAcceptedConnection } from "@/db/connections";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId } from "@/lib/sanitize";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid material ID format", 400);
    }

    const material = await getLearningMaterialById(id);
    if (!material) {
      return fail("NOT_FOUND", "Learning material not found", 404);
    }

    const isUploader = material.uploadedById.toString() === session.userId;
    const isAdmin = session.role === "admin";
    const isAssigned = await hasAssignedMaterialToLearner(id, session.userId);
    const isConnectedLearner = await hasAcceptedConnection(material.uploadedById, session.userId);

    // Strict Security: Only uploader, admin, assigned learner, or connected learner can view
    if (!isUploader && !isAdmin && !isAssigned && !isConnectedLearner) {
      return fail("FORBIDDEN", "You do not have permission to view this learning material", 403);
    }

    return ok({
      _id: material._id,
      fileName: material.fileName,
      extractedText: material.extractedText || "",
      chunks: material.chunks || null,
      uploadedById: material.uploadedById,
      createdAt: material.createdAt,
    });
  } catch (error) {
    return handleError(error);
  }
}
