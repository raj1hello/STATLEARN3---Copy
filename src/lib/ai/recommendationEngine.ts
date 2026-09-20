import { Course, Recommendation } from "@/types";
import { CompetencyGapDetail } from "./gapEngine";
import { ObjectId } from "mongodb";

export interface GeneratedRecommendationItem {
  courseId?: ObjectId;
  courseTitle?: string;
  competencyId?: ObjectId;
  competencyName: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

/**
 * Generates explainable course recommendations matched directly to the user's identified competency gaps.
 */
export function generateRecommendationsForGaps(params: {
  userId: ObjectId;
  gaps: CompetencyGapDetail[];
  availableCourses: Course[];
}): GeneratedRecommendationItem[] {
  const recommendations: GeneratedRecommendationItem[] = [];

  // Group available courses by competencyId string
  const courseMap = new Map<string, Course[]>();
  for (const course of params.availableCourses) {
    if (course.competencyId) {
      const cid = course.competencyId.toHexString();
      const existing = courseMap.get(cid) || [];
      existing.push(course);
      courseMap.set(cid, existing);
    }
  }

  for (const gap of params.gaps) {
    // Only recommend if there is an actual gap or deficiency
    if (gap.gap <= 0 && gap.severity === "low") continue;

    const matchingCourses = courseMap.get(gap.competencyId) || [];

    if (matchingCourses.length > 0) {
      for (const course of matchingCourses) {
        let reason = `Recommended because you have a ${gap.gap}-point gap in "${gap.competencyName}" (Current: ${gap.currentScore}%, Target: ${gap.targetScore}%). `;
        if (gap.evidenceSummary.easyQuestionsFailed > 0) {
          reason += `This course covers foundational basics to help resolve ${gap.evidenceSummary.easyQuestionsFailed} core concepts missed in recent assessments.`;
        } else if (gap.evidenceSummary.mediumQuestionsFailed > 0) {
          reason += `This resource provides applied problem-solving practice to bridge your intermediate skill gap.`;
        } else {
          reason += `Taking this module will help you achieve the target proficiency level.`;
        }

        recommendations.push({
          courseId: course._id,
          courseTitle: course.title,
          competencyId: course.competencyId,
          competencyName: gap.competencyName,
          reason,
          priority: gap.severity,
        });
      }
    } else {
      // General recommendation when specific course is not pre-mapped
      recommendations.push({
        competencyName: gap.competencyName,
        reason: `Targeted review recommended for "${gap.competencyName}" to close your ${gap.gap}-point proficiency deficit.`,
        priority: gap.severity,
      });
    }
  }

  return recommendations;
}

/**
 * Formats recommendation items into database documents.
 */
export function formatRecommendationsForDb(
  userId: ObjectId,
  items: GeneratedRecommendationItem[]
): Omit<Recommendation, "_id">[] {
  return items.map((item) => ({
    userId,
    courseId: item.courseId,
    reason: item.reason,
  }));
}
