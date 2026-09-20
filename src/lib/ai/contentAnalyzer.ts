import { aiProvider } from "./provider";

export interface ProcessedMaterialContent {
  extractedText: string;
  chunks: {
    chunkIndex: number;
    text: string;
    wordCount: number;
  }[];
  topics: string[];
  summary: string;
  suggestedCompetency?: string;
}

/**
 * Clean raw text from document streams.
 */
export function cleanRawText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split text into semantic chunks for analysis and downstream question generation.
 * Handles both multi-paragraph documents and long single paragraphs.
 */
export function chunkText(
  text: string,
  maxWordsPerChunk = 250
): { chunkIndex: number; text: string; wordCount: number }[] {
  const cleaned = cleanRawText(text);
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/);
  if (words.length <= maxWordsPerChunk) {
    return [{ chunkIndex: 0, text: cleaned, wordCount: words.length }];
  }

  const chunks: { chunkIndex: number; text: string; wordCount: number }[] = [];
  for (let i = 0; i < words.length; i += maxWordsPerChunk) {
    const slice = words.slice(i, i + maxWordsPerChunk);
    chunks.push({
      chunkIndex: chunks.length,
      text: slice.join(" "),
      wordCount: slice.length,
    });
  }

  return chunks;
}

/**
 * Main content processing pipeline: text extraction simulation / cleaning / chunking / AI topic extraction.
 */
export async function processLearningMaterialText(
  rawText: string,
  fileName: string
): Promise<ProcessedMaterialContent> {
  const cleaned = cleanRawText(rawText);
  const chunks = chunkText(cleaned);

  // Use AI Provider to extract topics and summarize
  let topics = ["Core Concepts", "Key Methodologies", "Practical Applications"];
  let summary = `Analyzed content from file: ${fileName}. Contains ${chunks.length} sections and ${cleaned.split(/\s+/).length} words.`;
  let suggestedCompetency = "General Analytics";

  try {
    const aiOutput = await aiProvider.generate({
      systemPrompt:
        "You are an expert curriculum and competency analyzer. Extract key topics, a summary, and suggested competency in JSON format.",
      prompt: `Analyze the following learning material:\n\n${cleaned.slice(0, 2000)}\n\nRespond with JSON: { "topics": string[], "summary": string, "suggestedCompetency": string }`,
    });

    const { extractJsonFromText } = await import("./responseParser");
    const parsed = (extractJsonFromText(aiOutput) || JSON.parse(aiOutput.replace(/```json/g, "").replace(/```/g, "").trim())) as Record<string, any>;
    if (Array.isArray(parsed.topics)) topics = parsed.topics;
    if (typeof parsed.summary === "string") summary = parsed.summary;
    if (typeof parsed.suggestedCompetency === "string")
      suggestedCompetency = parsed.suggestedCompetency;
  } catch (e) {
    // Graceful fallback to default extracted metadata
  }

  return {
    extractedText: cleaned,
    chunks,
    topics,
    summary,
    suggestedCompetency,
  };
}
