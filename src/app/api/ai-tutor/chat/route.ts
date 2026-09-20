import { requireSession } from "@/lib/auth/session";
import { aiProvider } from "@/lib/ai/provider";
import { sanitizeInput } from "@/lib/sanitize";
import { ok, handleError, fail } from "@/lib/apiResponse";
import { cleanRawText, chunkText } from "@/lib/ai/contentAnalyzer";
import { ChatAttachment } from "@/types";

const AI_TUTOR_SYSTEM_PROMPT = `You are the STATLEARN AI Tutor, an expert educational and statistical assistant for government and official statistics practitioners, civil servants, and learners.
Your primary role is to explain concepts clearly, accurately, concisely, and rigorously in well-structured markdown.
When asked about statistical topics (such as methodology, hypothesis testing, survey design, sampling, distributions, variance, data analysis), provide thorough, intuitive explanations with practical examples.
When asked about general science, mathematics, physics (e.g. Newton's laws, mechanics, calculus), economics, or other educational topics, answer the user's specific question directly, accurately, and clearly with relevant real-world examples.
Do NOT force unrelated statistical error explanations onto non-statistical or general science questions. Always directly answer the specific question asked by the user.
When the user attaches documents or files, analyze their content in relation to the user's query.`;

export async function POST(request: Request) {
  try {
    // Authenticate user session
    await requireSession(request);

    const rawBody: any = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);

    const prompt = cleanBody.prompt || cleanBody.text;
    const attachments: ChatAttachment[] = Array.isArray(cleanBody.attachments)
      ? cleanBody.attachments
      : [];

    if ((!prompt || typeof prompt !== "string" || !prompt.trim()) && attachments.length === 0) {
      return fail("VALIDATION_ERROR", "Prompt or attachment is required", 400);
    }

    const userText = (typeof prompt === "string" ? prompt.trim() : "");

    // Build context incorporating attached documents & files
    let documentContext = "";
    let imageNotes: string[] = [];

    if (attachments.length > 0) {
      attachments.forEach((att, idx) => {
        if (att.extractedText && att.extractedText.trim()) {
          const cleanedText = cleanRawText(att.extractedText);
          const chunks = chunkText(cleanedText, 250);
          const summaryPreview = chunks.slice(0, 6).map((c) => c.text).join("\n\n");
          documentContext += `\n\n--- ATTACHED DOCUMENT [${idx + 1}]: "${att.name}" (${att.type}) ---\n${summaryPreview}\n--- END OF DOCUMENT [${att.name}] ---\n`;
        } else if (att.category === "image" || att.type.startsWith("image/")) {
          imageNotes.push(`[Attached Image: ${att.name}]`);
        } else {
          documentContext += `\n[Attached File: ${att.name} (${att.type})]`;
        }
      });
    }

    let finalPrompt = userText;
    if (documentContext) {
      finalPrompt = `${userText ? `${userText}\n\n` : "Please analyze the attached document(s) in the context of statistical training:\n"}${documentContext}`;
    }
    if (imageNotes.length > 0) {
      finalPrompt += `\n\nAttachments present: ${imageNotes.join(", ")}`;
    }

    const aiResponse = await aiProvider.generate({
      prompt: finalPrompt,
      systemPrompt: AI_TUTOR_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 1200,
    });

    // Normal conversational chat should only provide educational text explanations.
    // Structured quiz/assessment/notes generation is strictly reserved for explicit UI action buttons.
    return ok({
      text: aiResponse,
    });
  } catch (error) {
    return handleError(error);
  }
}
