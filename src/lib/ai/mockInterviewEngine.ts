import { aiProvider } from "./provider";
import { MockInterviewQuestion, MockInterviewReport } from "@/types";

const INTERVIEWER_SYSTEM_PROMPT = `You are the STATLEARN Senior AI Technical & Behavioral Interviewer, an experienced hiring manager and domain expert.
Your role is to conduct professional, realistic, and adaptive technical and situational interviews.
Guidelines:
1. Ask one clear question at a time.
2. Adapt questions directly to the candidate's target role, seniority level, and previous responses.
3. Balance foundational principles, applied problem-solving, and situational judgment.
4. Evaluate responses objectively based on observable clarity, technical accuracy, and problem-solving depth.
5. Do NOT make unsupported psychological or personality claims. Focus on observable interview performance.
6. When responding, always format your output as valid JSON matching the requested structure.`;

export interface GenerateFirstQuestionParams {
  targetRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  jobDescription?: string;
}

export async function generateFirstQuestion(
  params: GenerateFirstQuestionParams
): Promise<MockInterviewQuestion> {
  const prompt = `Start a technical & behavioral mock interview for a candidate applying for the role of "${params.targetRole}" at "${params.difficulty}" difficulty level.
${params.jobDescription ? `Context / Job Description:\n${params.jobDescription}\n` : ""}

Generate the opening interview question. The question should establish core competence and background relevant to this specific role.

Respond ONLY with a JSON object in this exact schema (no markdown fences, raw JSON):
{
  "question": "Your opening interview question here",
  "category": "technical",
  "idealAnswerGuidelines": "Key points expected in a strong answer"
}`;

  try {
    const raw = await aiProvider.generate({
      prompt,
      systemPrompt: INTERVIEWER_SYSTEM_PROMPT,
      temperature: 0.7,
      maxTokens: 800,
    });

    const parsed = parseJsonFromResponse<{
      question: string;
      category?: "technical" | "behavioral" | "problem_solving" | "situational";
      idealAnswerGuidelines?: string;
    }>(raw);

    if (parsed && parsed.question) {
      return {
        id: "q-1",
        questionNumber: 1,
        question: parsed.question.trim(),
        category: parsed.category || "technical",
        idealAnswerGuidelines: parsed.idealAnswerGuidelines || "Demonstrates core conceptual understanding.",
      };
    }
  } catch (err) {
    console.warn("[MockInterviewEngine] AI generation failed, using fallback:", err);
  }

  const fallbackQuestions: Record<string, string> = {
    beginner: `Could you introduce yourself and describe your foundational experience and interest in the ${params.targetRole} domain? What core methodologies or tools are you most comfortable using?`,
    intermediate: `In your work as a ${params.targetRole}, how do you approach selecting appropriate analytical methodologies or system architectures when handling ambiguous problem requirements?`,
    advanced: `As a senior ${params.targetRole}, describe a complex end-to-end project or statistical model you led. How did you validate assumptions, mitigate edge cases, and communicate trade-offs to non-technical stakeholders?`,
  };

  const selectedFallbackQuestion = fallbackQuestions[params.difficulty] || fallbackQuestions.intermediate || "Please introduce yourself and your technical background.";

  return {
    id: "q-1",
    questionNumber: 1,
    question: selectedFallbackQuestion,
    category: "technical",
    idealAnswerGuidelines: "Clear articulation of relevant experience, methodology choices, and practical problem-solving mindset.",
  };
}

export interface EvaluateAndNextParams {
  targetRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  questionNumber: number;
  totalQuestions: number;
  currentQuestion: MockInterviewQuestion;
  userAnswer: string;
  previousQuestions: MockInterviewQuestion[];
}

export interface EvaluateAndNextResult {
  evaluation: NonNullable<MockInterviewQuestion["evaluation"]>;
  nextQuestion?: MockInterviewQuestion;
  isLastQuestion: boolean;
}

export async function evaluateAnswerAndGenerateNext(
  params: EvaluateAndNextParams
): Promise<EvaluateAndNextResult> {
  const isLastQuestion = params.questionNumber >= params.totalQuestions;

  const conversationHistory = params.previousQuestions
    .filter((q) => q.userAnswer)
    .map(
      (q, idx) =>
        `Q${idx + 1}: ${q.question}\nAnswer: ${q.userAnswer}\nFeedback: ${q.evaluation?.feedback || "Evaluated."}`
    )
    .join("\n\n");

  const prompt = `You are evaluating a candidate for the role of "${params.targetRole}" (${params.difficulty} level).
Interview Progress: Question ${params.questionNumber} of ${params.totalQuestions}.

Previous Interview History:
${conversationHistory || "None (this is the first answer)."}

Current Question (Q${params.questionNumber}):
"${params.currentQuestion.question}"

Candidate's Spoken/Transcribed Answer:
"${params.userAnswer}"

Tasks:
1. Evaluate the candidate's answer on:
   - relevanceScore (0-100)
   - technicalAccuracyScore (0-100)
   - communicationScore (0-100)
   - constructive feedback (2-3 sentences acknowledging strengths and noting any missing depth)
   - strengths list (1-2 bullet points)
   - improvements list (1-2 bullet points)

${
  !isLastQuestion
    ? `2. Formulate the next adaptive question (Q${params.questionNumber + 1}).
   Adapt the difficulty and topic based on the candidate's response. Mix technical depth, problem-solving scenarios, and situational questions.`
    : `2. This was the final question of the interview. Do not generate another question.`
}

Respond ONLY with a JSON object in this exact schema (raw JSON):
{
  "evaluation": {
    "relevanceScore": 85,
    "technicalAccuracyScore": 80,
    "communicationScore": 90,
    "feedback": "Concise feedback text here...",
    "strengths": ["Clear explanation of X", "Good practical example"],
    "improvements": ["Could have mentioned Y edge case"]
  }${
    !isLastQuestion
      ? `,
  "nextQuestion": {
    "question": "Your next question text here...",
    "category": "technical" or "problem_solving" or "behavioral" or "situational",
    "idealAnswerGuidelines": "Key points for next question"
  }`
      : ""
  }
}`;

  try {
    const raw = await aiProvider.generate({
      prompt,
      systemPrompt: INTERVIEWER_SYSTEM_PROMPT,
      temperature: 0.6,
      maxTokens: 1200,
    });

    const parsed = parseJsonFromResponse<{
      evaluation: NonNullable<MockInterviewQuestion["evaluation"]>;
      nextQuestion?: {
        question: string;
        category?: "technical" | "behavioral" | "problem_solving" | "situational";
        idealAnswerGuidelines?: string;
      };
    }>(raw);

    if (parsed && parsed.evaluation) {
      let nextQ: MockInterviewQuestion | undefined;
      if (!isLastQuestion && parsed.nextQuestion?.question) {
        nextQ = {
          id: `q-${params.questionNumber + 1}`,
          questionNumber: params.questionNumber + 1,
          question: parsed.nextQuestion.question.trim(),
          category: parsed.nextQuestion.category || "technical",
          idealAnswerGuidelines: parsed.nextQuestion.idealAnswerGuidelines || "Strong analytical response.",
        };
      }

      return {
        evaluation: {
          relevanceScore: clampScore(parsed.evaluation.relevanceScore, 75),
          technicalAccuracyScore: clampScore(parsed.evaluation.technicalAccuracyScore, 70),
          communicationScore: clampScore(parsed.evaluation.communicationScore, 80),
          feedback: parsed.evaluation.feedback || "Answer captured and evaluated successfully.",
          strengths: Array.isArray(parsed.evaluation.strengths) ? parsed.evaluation.strengths : ["Direct response to prompt"],
          improvements: Array.isArray(parsed.evaluation.improvements) ? parsed.evaluation.improvements : ["Add further quantitative context"],
        },
        nextQuestion: nextQ,
        isLastQuestion,
      };
    }
  } catch (err) {
    console.warn("[MockInterviewEngine] Evaluation generation failed, using structured fallback:", err);
  }

  // Deterministic fallback evaluation & next question
  const wordsCount = params.userAnswer.trim().split(/\s+/).length;
  const isDetailed = wordsCount >= 20;

  const fallbackEvaluation: NonNullable<MockInterviewQuestion["evaluation"]> = {
    relevanceScore: isDetailed ? 82 : 68,
    technicalAccuracyScore: isDetailed ? 78 : 65,
    communicationScore: isDetailed ? 85 : 70,
    feedback: isDetailed
      ? "You provided a coherent answer addressing the primary requirements of the question with sound domain logic."
      : "Your answer touched on the concept, but expanding with concrete methodology examples and edge cases would improve the score.",
    strengths: ["Clear spoken articulation", "Direct alignment with topic"],
    improvements: ["Expand on quantitative verification steps", "Cite specific tools or frameworks"],
  };

  const nextQuestionsPool = [
    `How do you evaluate data quality, outliers, or missing variables before applying formal statistical models?`,
    `Can you describe how you collaborate with cross-functional team members to translate technical insights into actionable policy or business decisions?`,
    `Walk me through an instance where an initial hypothesis or test model did not produce the expected result. How did you investigate and pivot?`,
    `What trade-offs do you consider when deciding between parametric and non-parametric analytical techniques in large datasets?`,
    `How do you keep your technical skills current with modern data science and statistical intelligence frameworks?`,
  ];

  let nextQ: MockInterviewQuestion | undefined;
  if (!isLastQuestion) {
    const nextIdx = params.questionNumber % nextQuestionsPool.length;
    const qText = nextQuestionsPool[nextIdx] || "Describe your approach to data quality and validation.";
    nextQ = {
      id: `q-${params.questionNumber + 1}`,
      questionNumber: params.questionNumber + 1,
      question: qText,
      category: nextIdx % 2 === 0 ? "problem_solving" : "behavioral",
      idealAnswerGuidelines: "Demonstrates practical reasoning and systematic methodology.",
    };
  }

  return {
    evaluation: fallbackEvaluation,
    nextQuestion: nextQ,
    isLastQuestion,
  };
}

export interface GenerateReportParams {
  targetRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  questions: MockInterviewQuestion[];
}

export async function generateFinalInterviewReport(
  params: GenerateReportParams
): Promise<MockInterviewReport> {
  const interviewSummaryText = params.questions
    .map(
      (q, idx) =>
        `Question ${idx + 1} (${q.category || "general"}): "${q.question}"\nCandidate Answer: "${q.userAnswer || "No answer recorded"}"\nEvaluation: Relevance=${q.evaluation?.relevanceScore || 70}, Tech=${q.evaluation?.technicalAccuracyScore || 70}, Comm=${q.evaluation?.communicationScore || 70}\nFeedback: ${q.evaluation?.feedback || "Completed"}`
    )
    .join("\n\n---\n\n");

  const prompt = `Generate a comprehensive Final Interview Performance Report for a candidate who completed a mock interview for the role of "${params.targetRole}" (${params.difficulty} difficulty).

Interview Transcript & Performance Data:
${interviewSummaryText}

Generate an objective, structured performance evaluation focusing on observable competencies.

Respond ONLY with a JSON object in this exact schema (raw JSON):
{
  "summary": "Executive summary of interview performance (3-4 sentences)...",
  "overallScore": 82,
  "technicalKnowledgeAssessment": "Detailed assessment of technical knowledge observed...",
  "problemSolvingAssessment": "Assessment of analytical problem solving and methodology...",
  "communicationObservations": "Observations on clarity, structure, and communication...",
  "strengths": [
    "Identified strength 1",
    "Identified strength 2",
    "Identified strength 3"
  ],
  "areasForImprovement": [
    "Area for improvement 1",
    "Area for improvement 2"
  ],
  "topicsToRevise": [
    "Specific topic 1",
    "Specific topic 2",
    "Specific topic 3"
  ],
  "recommendedResources": [
    {
      "title": "Course/Module Name",
      "topic": "Related Topic",
      "description": "Why this resource helps bridge the identified gap"
    }
  ],
  "finalFeedback": "Encouraging and actionable closing feedback for the candidate..."
}`;

  try {
    const raw = await aiProvider.generate({
      prompt,
      systemPrompt: INTERVIEWER_SYSTEM_PROMPT,
      temperature: 0.5,
      maxTokens: 1500,
    });

    const parsed = parseJsonFromResponse<MockInterviewReport>(raw);
    if (parsed && parsed.overallScore !== undefined) {
      return {
        summary: parsed.summary || "Mock interview completed with positive demonstration of key competencies.",
        overallScore: clampScore(parsed.overallScore, 78),
        technicalKnowledgeAssessment: parsed.technicalKnowledgeAssessment || "Demonstrated sound grasp of core domain principles.",
        problemSolvingAssessment: parsed.problemSolvingAssessment || "Approached problems with structured reasoning.",
        communicationObservations: parsed.communicationObservations || "Spoke clearly with appropriate terminology.",
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ["Structured communication", "Domain terminology"],
        areasForImprovement: Array.isArray(parsed.areasForImprovement) && parsed.areasForImprovement.length > 0 ? parsed.areasForImprovement : ["Provide deeper quantitative justifications"],
        topicsToRevise: Array.isArray(parsed.topicsToRevise) && parsed.topicsToRevise.length > 0 ? parsed.topicsToRevise : ["Inferential statistics", "Hypothesis testing"],
        recommendedResources: Array.isArray(parsed.recommendedResources) && parsed.recommendedResources.length > 0 ? parsed.recommendedResources : [
          { title: `iGOT: Advanced ${params.targetRole} Competencies`, topic: params.targetRole, description: "Structured national curriculum module" }
        ],
        finalFeedback: parsed.finalFeedback || "Strong baseline performance. Consistent practice will prepare you for high-stakes interviews.",
        generatedAt: new Date(),
      };
    }
  } catch (err) {
    console.warn("[MockInterviewEngine] Report generation failed, using fallback report:", err);
  }

  // Calculate average score from evaluations
  let sumScores = 0;
  let scoreCount = 0;
  params.questions.forEach((q) => {
    if (q.evaluation) {
      const avg = (q.evaluation.relevanceScore + q.evaluation.technicalAccuracyScore + q.evaluation.communicationScore) / 3;
      sumScores += avg;
      scoreCount++;
    }
  });
  const avgOverall = scoreCount > 0 ? Math.round(sumScores / scoreCount) : 76;

  return {
    summary: `The candidate completed all ${params.questions.length} interview questions for the ${params.targetRole} position at ${params.difficulty} difficulty. Demonstrates clear foundational ability and structured communication.`,
    overallScore: avgOverall,
    technicalKnowledgeAssessment: `Candidate displayed good comprehension of core ${params.targetRole} terminology and workflows, with solid foundational answers across technical questions.`,
    problemSolvingAssessment: `Approached analytical scenarios logically, articulating clear step-by-step methodologies when answering diagnostic questions.`,
    communicationObservations: `Clear speech delivery, good structure, and direct answers to the interviewer's prompts without excessive filler.`,
    strengths: [
      `Sound technical grasp of ${params.targetRole} foundations`,
      "Coherent and organized answer structure",
      "Confidence in responding to adaptive questions",
    ],
    areasForImprovement: [
      "Deepen quantitative justifications and concrete data examples",
      "Elaborate on edge-case handling under operational constraints",
    ],
    topicsToRevise: [
      "Statistical Hypothesis Testing & Power Analysis",
      "Sampling Variance & Error Minimization",
      "Data Pipeline Validation Frameworks",
    ],
    recommendedResources: [
      {
        title: "iGOT Karmayogi: Inferential Statistics & Methodology",
        topic: "Statistics",
        description: "Covers foundational and intermediate statistical inference drills.",
      },
      {
        title: "iGOT Karmayogi: Data Analytics & Quantitative Governance",
        topic: "Data Analytics",
        description: "Practical scenarios and problem-solving exercises.",
      },
    ],
    finalFeedback: `Overall, a commendable interview session. Focusing on providing specific numerical examples and operational case studies will elevate your interview performance to senior mastery.`,
    generatedAt: new Date(),
  };
}

function clampScore(val: unknown, fallback: number): number {
  if (typeof val === "number" && !isNaN(val)) {
    return Math.max(0, Math.min(100, Math.round(val)));
  }
  return fallback;
}

function parseJsonFromResponse<T>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Try regex extraction of first JSON object
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
