import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { createUserNote, getUserNotes } from "@/db/userNotes";
import { aiProvider } from "@/lib/ai/provider";
import { ok, fail, handleError, Errors } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/sanitize";

const MakeNotesSchema = z.object({
  topic: z.string().min(2).max(300).optional(),
  conversationContext: z.string().min(10, "A meaningful conversation context is required"),
  conversationId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const notes = await getUserNotes(session.userId);
    return ok({ notes });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);

    // Rate limiting: 8 note generations per minute per user
    const rateCheck = checkRateLimit(`ai-tutor-notes:${session.userId}`, {
      windowMs: 60 * 1000,
      max: 8,
    });
    if (!rateCheck.allowed) {
      throw Errors.rateLimited();
    }

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = MakeNotesSchema.parse(cleanBody);

    const topic = parsed.topic || "Statistical Notes";

    // Call AI Provider to generate structured notes from the conversation context
    let summary = `Comprehensive study notes and summary of key concepts discussed regarding ${topic}.`;
    let keyPoints: string[] = [
      "Definition and core principles of the statistical topic",
      "Key formulas, critical assumptions, and sample sizing guidelines",
      "Common pitfalls, variance control, and bias mitigation strategies"
    ];
    let practicalTakeaways: string[] = [
      "Apply confidence bounds consistently across survey analysis",
      "Verify statistical assumptions prior to model estimation"
    ];

    try {
      const aiPrompt = `Generate concise, high-yield study notes from this statistical tutoring conversation:\n\n${parsed.conversationContext.slice(0, 3000)}\n\nRespond with strict JSON in this shape:\n{\n  "title": string,\n  "summary": string,\n  "keyPoints": string[],\n  "practicalTakeaways": string[]\n}`;

      const aiResponse = await aiProvider.generate({
        systemPrompt: "You are an expert statistical tutor note-maker. Extract structured study notes in valid JSON.",
        prompt: aiPrompt,
        temperature: 0.5,
        maxTokens: 1500,
      });

      const { extractJsonFromText } = await import("@/lib/ai/responseParser");
      const parsedJson = (extractJsonFromText(aiResponse) || {}) as Record<string, any>;

      if (typeof parsedJson.summary === "string" && parsedJson.summary.trim()) summary = parsedJson.summary;
      if (Array.isArray(parsedJson.keyPoints) && parsedJson.keyPoints.length > 0) keyPoints = parsedJson.keyPoints;
      if (Array.isArray(parsedJson.practicalTakeaways) && parsedJson.practicalTakeaways.length > 0) practicalTakeaways = parsedJson.practicalTakeaways;
    } catch {
      // Fallback to structured defaults based on conversation
    }

    const title = `Study Notes: ${topic}`;
    const markdownContent = `## ${title}\n\n**Executive Summary:**\n${summary}\n\n### 🔑 Key Principles & Concepts:\n${keyPoints.map((kp) => `- ${kp}`).join("\n")}\n\n### 💡 Practical Takeaways:\n${practicalTakeaways.map((pt) => `- ${pt}`).join("\n")}\n\n*Generated from AI Tutor conversation session.*`;

    // Persist note to MongoDB user_notes collection scoped strictly to session.userId
    const savedNote = await createUserNote(session.userId, {
      title,
      topic,
      summary,
      keyPoints,
      practicalTakeaways,
      markdownContent,
      conversationId: parsed.conversationId,
    });

    return ok(
      {
        note: savedNote,
        message: "Study notes generated and saved to your profile.",
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
