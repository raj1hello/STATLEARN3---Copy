import { CompetencyGapDetail } from "./gapEngine";
import { Course } from "@/types";

export interface LearningPathWeek {
  weekNumber: number;
  theme: string;
  focusArea: string;
  tasks: {
    id: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    resourceType: "reading" | "video" | "interactive_quiz" | "applied_exercise" | "assessment";
    status: "pending" | "in_progress" | "completed";
  }[];
}

export interface StructuredLearningPlan {
  title: string;
  description: string;
  totalWeeks: 4;
  targetCompetencies: string[];
  weeks: {
    week1: LearningPathWeek;
    week2: LearningPathWeek;
    week3: LearningPathWeek;
    week4: LearningPathWeek;
  };
}

/**
 * Generates a tailored 4-week learning roadmap customized to the user's specific skill deficits.
 */
export function generateStructuredLearningPath(
  gaps: CompetencyGapDetail[],
  courses: Course[]
): StructuredLearningPlan {
  const topGaps = gaps.slice(0, 3);
  const targetCompetencyNames = topGaps.map((g) => g.competencyName);
  const primaryCompetency = targetCompetencyNames[0] || "Foundational Analytics";

  const week1: LearningPathWeek = {
    weekNumber: 1,
    theme: "Foundation",
    focusArea: `Core Concepts & Theoretical Framework for ${primaryCompetency}`,
    tasks: [
      {
        id: "w1-t1",
        title: `Review Core Fundamentals of ${primaryCompetency}`,
        description: `Study key definitions, principles, and common misconceptions identified in initial gap analysis.`,
        estimatedMinutes: 60,
        resourceType: "reading",
        status: "pending",
      },
      {
        id: "w1-t2",
        title: "Concept Clarification Video Lecture",
        description: "Watch guided walkthrough of fundamental statistical mechanics and theory.",
        estimatedMinutes: 45,
        resourceType: "video",
        status: "pending",
      },
      {
        id: "w1-t3",
        title: "Foundational Diagnostic Quiz",
        description: "Self-paced easy-difficulty check on core vocabulary and concepts.",
        estimatedMinutes: 20,
        resourceType: "interactive_quiz",
        status: "pending",
      },
    ],
  };

  const week2: LearningPathWeek = {
    weekNumber: 2,
    theme: "Weak Concept Practice",
    focusArea: `Targeted Drills on Identified Deficiencies in ${targetCompetencyNames.join(", ")}`,
    tasks: [
      {
        id: "w2-t1",
        title: "Deficiency Breakdown & Error Analysis",
        description: "Review explanations of missed questions from past assessment submissions.",
        estimatedMinutes: 40,
        resourceType: "reading",
        status: "pending",
      },
      {
        id: "w2-t2",
        title: "Targeted Medium-Difficulty Problem Sets",
        description: "Solve 15 focused problems addressing specific reasoning gaps.",
        estimatedMinutes: 60,
        resourceType: "applied_exercise",
        status: "pending",
      },
      {
        id: "w2-t3",
        title: "Mid-Sprint Checkpoint",
        description: "Adaptive quiz evaluating progress on previously failed concepts.",
        estimatedMinutes: 30,
        resourceType: "interactive_quiz",
        status: "pending",
      },
    ],
  };

  const week3: LearningPathWeek = {
    weekNumber: 3,
    theme: "Applied Practice",
    focusArea: `Real-World Scenarios & Case Analysis for ${primaryCompetency}`,
    tasks: [
      {
        id: "w3-t1",
        title: "Scenario-Based Case Study",
        description: "Analyze end-to-end dataset scenarios and interpret output metrics.",
        estimatedMinutes: 75,
        resourceType: "applied_exercise",
        status: "pending",
      },
      {
        id: "w3-t2",
        title: "Advanced Application Exercises",
        description: "Practice solving complex and hard-level multiple-choice problem sets.",
        estimatedMinutes: 60,
        resourceType: "applied_exercise",
        status: "pending",
      },
    ],
  };

  const week4: LearningPathWeek = {
    weekNumber: 4,
    theme: "Reassessment",
    focusArea: "Comprehensive Evaluation & Mastery Verification",
    tasks: [
      {
        id: "w4-t1",
        title: "Final Review & Summary Notes",
        description: "Quick revision of all target competency guidelines and formulas.",
        estimatedMinutes: 30,
        resourceType: "reading",
        status: "pending",
      },
      {
        id: "w4-t2",
        title: "Full Reassessment Exam",
        description: "Complete the official published reassessment to benchmark score improvement.",
        estimatedMinutes: 45,
        resourceType: "assessment",
        status: "pending",
      },
    ],
  };

  return {
    title: `Targeted 4-Week Mastery Plan: ${primaryCompetency}`,
    description: `A customized 4-week structured progression designed to close identified skill gaps in ${targetCompetencyNames.join(", ")}.`,
    totalWeeks: 4,
    targetCompetencies: targetCompetencyNames,
    weeks: {
      week1,
      week2,
      week3,
      week4,
    },
  };
}
