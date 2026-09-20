import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { checkRateLimit } from "@/lib/rateLimit";
import { createLearningMaterial } from "@/db/learningMaterials";
import { env } from "@/lib/env";
import { ok, fail, handleError, Errors } from "@/lib/apiResponse";
import { sanitizeInput, toObjectId } from "@/lib/sanitize";

// Schema for raw text or base64 upload payload
const UploadMaterialSchema = z.object({
  fileName: z.string().min(3).max(255).regex(/^[\w\-. ]+$/, "Invalid characters in filename"),
  fileType: z.enum(["application/pdf", "text/plain"]),
  fileSize: z.number().int().positive().max(env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, `File size exceeds ${env.MAX_UPLOAD_SIZE_MB}MB limit`),
  textContent: z.string().min(10, "Text content must be at least 10 characters").max(200000),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);

    // Rate limiting: 10 uploads per minute per user
    const rateCheck = checkRateLimit(`upload:${session.userId}`, {
      windowMs: 60 * 1000,
      max: 10,
    });
    if (!rateCheck.allowed) {
      throw Errors.rateLimited();
    }

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = UploadMaterialSchema.parse(cleanBody);

    // Validate file extension
    const ext = parsed.fileName.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      return fail("INVALID_FILE_TYPE", "Only .pdf and .txt files are supported", 400);
    }

    const material = await createLearningMaterial({
      uploadedById: toObjectId(session.userId),
      fileName: parsed.fileName,
      extractedText: parsed.textContent,
      createdAt: new Date(),
    });

    return ok(material, 201);
  } catch (error) {
    return handleError(error);
  }
}
