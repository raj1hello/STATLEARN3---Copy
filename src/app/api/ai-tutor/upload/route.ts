import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { env } from "@/lib/env";
import { ok, fail, handleError, Errors } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/sanitize";

const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // General Data/Files
  "application/json",
];

const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", "md", "csv",
  "jpg", "jpeg", "png", "webp", "gif",
  "json"
];

const UploadAttachmentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100),
  fileSize: z.number().int().positive().max(
    env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    `File size exceeds ${env.MAX_UPLOAD_SIZE_MB}MB limit`
  ),
  category: z.enum(["document", "image", "file"]),
  fileData: z.string().max(25 * 1024 * 1024, "File payload is too large"), // Base64 data URL or raw text
  extractedText: z.string().max(300000).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const session = await requireSession(request);

    // 2. Rate limiting: 20 attachment uploads per minute per user
    const rateCheck = checkRateLimit(`ai-tutor-upload:${session.userId}`, {
      windowMs: 60 * 1000,
      max: 20,
    });
    if (!rateCheck.allowed) {
      throw Errors.rateLimited();
    }

    // 3. Parse and validate request
    const rawBody = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = UploadAttachmentSchema.parse(cleanBody);

    // 4. Validate extension and MIME type
    const ext = parsed.fileName.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return fail(
        "INVALID_FILE_TYPE",
        `File extension .${ext} is not supported. Supported extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
        400
      );
    }

    if (parsed.fileType && !ALLOWED_MIME_TYPES.includes(parsed.fileType.toLowerCase())) {
      // If MIME is generic octet-stream, check extension validity
      if (parsed.fileType !== "application/octet-stream") {
        return fail(
          "INVALID_MIME_TYPE",
          `MIME type "${parsed.fileType}" is not supported.`,
          400
        );
      }
    }

    // 5. Build structured attachment response scoped for the authenticated session
    const attachmentId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // For images, we can preserve the dataUrl for frontend rendering
    // For text/documents, if extractedText wasn't provided, try extracting text if it's text-based
    let textContent = parsed.extractedText;
    if (!textContent && (parsed.fileType.startsWith("text/") || ext === "txt" || ext === "md" || ext === "csv" || ext === "json")) {
      if (parsed.fileData.startsWith("data:")) {
        const base64Part = parsed.fileData.split(",")[1];
        if (base64Part) {
          try {
            textContent = Buffer.from(base64Part, "base64").toString("utf-8");
          } catch {
            // keep undefined
          }
        }
      } else {
        textContent = parsed.fileData;
      }
    }

    const attachment = {
      id: attachmentId,
      name: parsed.fileName,
      type: parsed.fileType,
      size: parsed.fileSize,
      category: parsed.category,
      dataUrl: parsed.category === "image" || parsed.fileType.startsWith("image/") ? parsed.fileData : undefined,
      extractedText: textContent ? textContent.slice(0, 50000) : undefined,
      uploadedAt: new Date().toISOString(),
    };

    return ok({ attachment }, 201);
  } catch (error) {
    return handleError(error);
  }
}
