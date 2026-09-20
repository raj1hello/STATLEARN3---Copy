import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { getLearningMaterialById, updateLearningMaterialProcessing } from "@/db/learningMaterials";
import { processLearningMaterialText } from "@/lib/ai/contentAnalyzer";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId } from "@/lib/sanitize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return fail("INVALID_ID", "Invalid material ID format", 400);
    }

    const material = await getLearningMaterialById(id);
    if (!material) {
      return fail("NOT_FOUND", "Learning material not found", 404);
    }

    if (!material.extractedText) {
      return fail("EMPTY_MATERIAL", "Material contains no text content to process", 400);
    }

    // Process through AI Content Analyzer pipeline
    const processed = await processLearningMaterialText(material.extractedText, material.fileName);

    // Persist processed chunks and metadata
    const updated = await updateLearningMaterialProcessing(id, {
      extractedText: processed.extractedText,
      chunks: {
        chunks: processed.chunks,
        topics: processed.topics,
        summary: processed.summary,
        suggestedCompetency: processed.suggestedCompetency,
        processedAt: new Date().toISOString(),
      },
    });

    return ok({
      materialId: id,
      fileName: material.fileName,
      totalChunks: processed.chunks.length,
      topics: processed.topics,
      summary: processed.summary,
      suggestedCompetency: processed.suggestedCompetency,
      chunks: processed.chunks,
    });
  } catch (error) {
    return handleError(error);
  }
}
