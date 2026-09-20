import { z } from "zod";
import { GeneratedQuestionSchema, AIQuizResponseSchema } from "@/lib/ai/assessmentGenerator";
import { createAssessment } from "@/db/assessments";
import { insertQuestions } from "@/db/questions";
import { createUserNote } from "@/db/userNotes";
import { toObjectId } from "@/lib/sanitize";

export interface CleanTextOptions {
  stripMarkdownFences?: boolean;
}

/**
 * Robust JSON extractor from Claude/LLM output:
 * Handles pure JSON, markdown-fenced ```json ... ```, and JSON embedded in conversational text.
 */
export function extractJsonFromText(rawText: string): unknown | null {
  if (!rawText || typeof rawText !== "string") return null;

  const trimmed = rawText.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Extract from markdown code fences (```json ... ``` or ``` ... ```)
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fenceMatch = trimmed.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // 3. Find outermost JSON object {...} or array [...]
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    } catch {}
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const candidate = trimmed.slice(firstBracket, lastBracket + 1);
      return JSON.parse(candidate);
    } catch {}
  }

  return null;
}

export const NotesPayloadSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  practicalTakeaways: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

export interface ProcessedChatResponse {
  displayText: string;
  isStructuredAction: boolean;
  actionType?: "quiz" | "assessment" | "notes";
  actionResult?: {
    id?: string;
    title?: string;
    totalCount?: number;
    message?: string;
  };
}

/**
 * Inspects AI Tutor chat response from Claude or Fallback engine.
 * If Claude returned a structured action (quiz questions or study notes JSON),
 * it validates against Zod schemas, persists the record to the authenticated user,
 * and formats a clean human-readable response instead of raw JSON.
 */
export async function handleAiTutorResponse(
  rawAiOutput: string,
  userId: string,
  userPromptText: string
): Promise<ProcessedChatResponse> {
  const parsedJson = extractJsonFromText(rawAiOutput);

  if (parsedJson && typeof parsedJson === "object") {
    // 1. Check if it's Quiz or Assessment Questions JSON
    const quizValidation = AIQuizResponseSchema.safeParse(parsedJson);
    if (quizValidation.success && quizValidation.data.questions.length > 0) {
      const questionsList = quizValidation.data.questions;
      const isAssessmentPrompt = /assessment|exam|diagnostic/i.test(userPromptText);
      const actionType = isAssessmentPrompt ? "assessment" : "quiz";
      const topic = userPromptText.slice(0, 50).trim() || "Statistical Concepts";
      const title = `${isAssessmentPrompt ? "AI Assessment" : "AI Practice Quiz"}: ${topic}`;

      try {
        const userObjId = toObjectId(userId);
        const assessmentDoc = await createAssessment({
          title,
          type: "mcq",
          createdById: userObjId,
          published: true, // Published for instant practice by the learner
          createdAt: new Date(),
        });

        const questionsToInsert = questionsList.map((q) => {
          const hasCorrect = q.answers.some((a) => a.isCorrect);
          const answers = q.answers.map((a) => ({
            text: a.text,
            isCorrect: a.isCorrect,
            explanation: a.explanation,
          }));
          if (!hasCorrect && answers.length > 0 && answers[0]) {
            answers[0].isCorrect = true;
          }

          return {
            assessmentId: assessmentDoc._id!,
            text: q.text,
            type: q.type,
            difficulty: q.difficulty,
            aiGenerated: true,
            reviewedByTrainer: false,
            answers,
          };
        });

        const insertedIds = await insertQuestions(questionsToInsert);

        const confirmationText = `✅ **${isAssessmentPrompt ? "Assessment" : "Quiz"} Created Successfully!**\n\nI have generated **${insertedIds.length} questions** on **${topic}** and added it directly to your Practice library as *"**${title}**"*.\n\nYou can start practicing this quiz anytime from your **Assessments & Practice** tab.`;

        return {
          displayText: confirmationText,
          isStructuredAction: true,
          actionType,
          actionResult: {
            id: assessmentDoc._id?.toHexString(),
            title,
            totalCount: insertedIds.length,
            message: confirmationText,
          },
        };
      } catch (err) {
        // If persistence fails, fall back to formatted markdown overview instead of raw JSON
        const sampleQuestions = questionsList
          .map((q, idx) => `**Q${idx + 1}. ${q.text}**\n${q.answers.map((a, i) => `  - ${String.fromCharCode(65 + i)}) ${a.text}`).join("\n")}`)
          .join("\n\n");

        return {
          displayText: `Here are the generated ${actionType} questions on **${topic}**:\n\n${sampleQuestions}`,
          isStructuredAction: true,
          actionType,
        };
      }
    }

    // 2. Check if it's Study Notes / Extraction JSON
    const notesValidation = NotesPayloadSchema.safeParse(parsedJson);
    if (
      notesValidation.success &&
      (notesValidation.data.summary || (notesValidation.data.keyPoints && notesValidation.data.keyPoints.length > 0))
    ) {
      const { summary, keyPoints = [], practicalTakeaways = [], title = "Study Notes: Statistical Analysis" } = notesValidation.data;
      const topic = userPromptText.slice(0, 50).trim() || "Statistical Topic";
      const finalTitle = title.startsWith("Study Notes:") ? title : `Study Notes: ${title || topic}`;

      const markdownContent = `## ${finalTitle}\n\n**Executive Summary:**\n${summary || "Comprehensive summary of statistical concepts."}\n\n### 🔑 Key Principles:\n${keyPoints.map((kp) => `- ${kp}`).join("\n")}\n\n### 💡 Practical Takeaways:\n${practicalTakeaways.map((pt) => `- ${pt}`).join("\n")}\n\n*Generated from AI Tutor conversation.*`;

      try {
        const savedNote = await createUserNote(userId, {
          title: finalTitle,
          topic,
          summary: summary || "",
          keyPoints,
          practicalTakeaways,
          markdownContent,
        });

        return {
          displayText: `📝 **Study Notes Created and Saved!**\n\n${markdownContent}`,
          isStructuredAction: true,
          actionType: "notes",
          actionResult: {
            id: savedNote?._id?.toHexString(),
            title: finalTitle,
            message: "Notes saved to your study notes repository.",
          },
        };
      } catch {
        return {
          displayText: markdownContent,
          isStructuredAction: true,
          actionType: "notes",
        };
      }
    }

    // 3. If it's a generic JSON fallback object like {"response": "..."}
    const genericObj = parsedJson as Record<string, unknown>;
    if (typeof genericObj.response === "string") {
      return {
        displayText: genericObj.response,
        isStructuredAction: false,
      };
    }
  }

  // Normal conversational response (standard readable assistant text)
  return {
    displayText: rawAiOutput,
    isStructuredAction: false,
  };
}
