import { AssessmentAttempt, Question, UserCompetency, Competency } from "@/types";

export interface QuestionEvidenceDetail {
  questionId?: string;
  questionText: string;
  difficulty: string;
  isCorrect: boolean;
  selectedAnswerIndex?: number;
  competencyId?: string;
  explanation?: string;
}

export interface CompetencyGapDetail {
  competencyId: string;
  competencyName: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  severity: "high" | "medium" | "low";
  weightedDeficiencyScore: number; // based on difficulty weighting of incorrect answers
  evidenceSummary: {
    incorrectQuestionsCount: number;
    hardQuestionsFailed: number;
    mediumQuestionsFailed: number;
    easyQuestionsFailed: number;
    repeatedMistakes: boolean;
  };
  explanation: string;
}

export interface GapAnalysisReport {
  userId: string;
  generatedAt: string;
  overallGapIndex: number;
  competencies: CompetencyGapDetail[];
  keyRecommendationsOverview: string[];
}

/**
 * Calculates evidence-based gap analysis combining attempts, questions answered,
 * difficulty weighting, and competency targets.
 */
export function calculateGapAnalysis(params: {
  userId: string;
  userCompetencies: UserCompetency[];
  competencyCatalogue: Competency[];
  attempts: AssessmentAttempt[];
  questionsMap: Map<string, Question>;
}): GapAnalysisReport {
  const compMap = new Map<string, Competency>();
  for (const c of params.competencyCatalogue) {
    if (c._id) compMap.set(c._id.toHexString(), c);
  }

  const gapDetails: CompetencyGapDetail[] = [];

  for (const uc of params.userCompetencies) {
    const cId = uc.competencyId.toHexString();
    const competency = compMap.get(cId);
    const competencyName = competency?.name || "General Competency";

    const currentScore = uc.currentScore;
    const targetScore = uc.targetScore;
    const baseGap = Math.max(0, targetScore - currentScore);

    // Analyze evidence from attempts
    let incorrectCount = 0;
    let hardFailed = 0;
    let medFailed = 0;
    let easyFailed = 0;
    let totalQuestionsEvaluated = 0;

    for (const attempt of params.attempts) {
      const evidence = attempt.evidence as { items?: QuestionEvidenceDetail[] } | undefined;
      if (evidence?.items && Array.isArray(evidence.items)) {
        for (const item of evidence.items) {
          if (item.competencyId === cId || !item.competencyId) {
            totalQuestionsEvaluated++;
            if (!item.isCorrect) {
              incorrectCount++;
              if (item.difficulty === "hard") hardFailed++;
              else if (item.difficulty === "medium") medFailed++;
              else if (item.difficulty === "easy") easyFailed++;
            }
          }
        }
      }
    }

    // Weighted deficiency calculation: easy failures count more heavily towards deficiency
    const weightedDeficiency = easyFailed * 3.0 + medFailed * 2.0 + hardFailed * 1.0;

    // Check for historical repeated mistakes (trend not improving)
    const history = uc.history || [];
    const repeatedMistakes =
      history.length >= 2 &&
      (history[history.length - 1]?.score ?? 0) <= (history[history.length - 2]?.score ?? 0);

    // Determine severity
    let severity: "high" | "medium" | "low" = "low";
    if (baseGap > 25 || easyFailed > 1 || currentScore < 50) {
      severity = "high";
    } else if (baseGap > 10 || medFailed > 2 || currentScore < 75) {
      severity = "medium";
    }

    // Formulate human-readable, evidence-based explanation
    let explanation = `Learner has a gap of ${baseGap} points (current: ${currentScore}, target: ${targetScore}) in ${competencyName}.`;
    if (easyFailed > 0) {
      explanation += ` Critical conceptual gaps identified: missed ${easyFailed} foundational (easy) questions.`;
    } else if (medFailed > 0) {
      explanation += ` Intermediate reasoning gaps: missed ${medFailed} medium-difficulty application questions.`;
    } else if (hardFailed > 0) {
      explanation += ` Advanced mastery gaps: failed ${hardFailed} complex synthesis questions.`;
    }
    if (repeatedMistakes) {
      explanation += ` Persistent stagnation detected across recent attempts.`;
    }

    gapDetails.push({
      competencyId: cId,
      competencyName,
      currentScore,
      targetScore,
      gap: baseGap,
      severity,
      weightedDeficiencyScore: weightedDeficiency,
      evidenceSummary: {
        incorrectQuestionsCount: incorrectCount,
        hardQuestionsFailed: hardFailed,
        mediumQuestionsFailed: medFailed,
        easyQuestionsFailed: easyFailed,
        repeatedMistakes,
      },
      explanation,
    });
  }

  // Sort by highest gap and severity
  gapDetails.sort((a, b) => b.gap - a.gap || b.weightedDeficiencyScore - a.weightedDeficiencyScore);

  const overallGapIndex =
    gapDetails.length > 0
      ? Math.round(gapDetails.reduce((sum, g) => sum + g.gap, 0) / gapDetails.length)
      : 0;

  const keyRecommendationsOverview = gapDetails
    .filter((g) => g.severity === "high" || g.severity === "medium")
    .map(
      (g) =>
        `Focus on ${g.competencyName}: Address ${g.evidenceSummary.easyQuestionsFailed > 0 ? "foundational principles" : "applied analytical problems"}.`
    );

  return {
    userId: params.userId,
    generatedAt: new Date().toISOString(),
    overallGapIndex,
    competencies: gapDetails,
    keyRecommendationsOverview,
  };
}
