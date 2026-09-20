import { UserCompetency } from "@/types";

export interface CompetencyAnalysisResult {
  competencyId: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  status: "proficient" | "progressing" | "needs_improvement";
  historicalTrend: {
    firstScore?: number;
    latestScore?: number;
    improvement: number;
    attemptsCount: number;
  };
}

export interface ComprehensiveCompetencyReport {
  overallAverageScore: number;
  totalCompetencies: number;
  strongAreas: CompetencyAnalysisResult[];
  weakAreas: CompetencyAnalysisResult[];
  items: CompetencyAnalysisResult[];
}

/**
 * Analyzes an individual user's competency performance, historical trends,
 * and calculates the quantitative gap to target.
 */
export function analyzeUserCompetency(uc: UserCompetency): CompetencyAnalysisResult {
  const gap = Math.max(0, uc.targetScore - uc.currentScore);

  let status: "proficient" | "progressing" | "needs_improvement" = "needs_improvement";
  if (uc.currentScore >= uc.targetScore) {
    status = "proficient";
  } else if (uc.currentScore >= uc.targetScore * 0.7) {
    status = "progressing";
  }

  const history = uc.history || [];
  const firstScore = history.length > 0 ? history[0]?.score : uc.currentScore;
  const latestScore = history.length > 0 ? history[history.length - 1]?.score : uc.currentScore;
  const improvement = (latestScore ?? 0) - (firstScore ?? 0);

  return {
    competencyId: uc.competencyId.toHexString(),
    currentScore: uc.currentScore,
    targetScore: uc.targetScore,
    gap,
    status,
    historicalTrend: {
      firstScore,
      latestScore,
      improvement,
      attemptsCount: history.length,
    },
  };
}

/**
 * Aggregates all competencies for a user and identifies strong vs weak areas.
 */
export function analyzeAllUserCompetencies(
  competencies: UserCompetency[]
): ComprehensiveCompetencyReport {
  if (competencies.length === 0) {
    return {
      overallAverageScore: 0,
      totalCompetencies: 0,
      strongAreas: [],
      weakAreas: [],
      items: [],
    };
  }

  const analyzed = competencies.map(analyzeUserCompetency);
  const totalScore = analyzed.reduce((sum, item) => sum + item.currentScore, 0);
  const overallAverageScore = Math.round(totalScore / analyzed.length);

  // Strong: score >= 75 or gap <= 10
  const strongAreas = analyzed.filter((a) => a.currentScore >= 75);
  // Weak: score < 70 or gap > 20
  const weakAreas = analyzed.filter((a) => a.currentScore < 70);

  return {
    overallAverageScore,
    totalCompetencies: analyzed.length,
    strongAreas,
    weakAreas,
    items: analyzed,
  };
}
