import * as dotenv from "dotenv";
dotenv.config();

import { MockAuthProvider } from "../src/lib/auth/provider";
import { sanitizeInput, isValidObjectId, toObjectId } from "../src/lib/sanitize";
import { analyzeAllUserCompetencies } from "../src/lib/ai/competencyAnalyzer";
import { cleanRawText, chunkText, processLearningMaterialText } from "../src/lib/ai/contentAnalyzer";
import { generateQuizQuestions } from "../src/lib/ai/assessmentGenerator";
import { calculateGapAnalysis } from "../src/lib/ai/gapEngine";
import { generateRecommendationsForGaps } from "../src/lib/ai/recommendationEngine";
import { generateStructuredLearningPath } from "../src/lib/ai/aiTutor";
import { checkRateLimit } from "../src/lib/rateLimit";
import { ObjectId } from "mongodb";
import { Competency, Course, Question, UserCompetency } from "../src/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("\n==========================================");
  console.log("STARTING BACKEND TEST SUITE");
  console.log("==========================================\n");

  // 1. Test Sanitizer & NoSQL Injection Protection
  console.log("\n--- 1. Testing NoSQL Injection Protection & ObjectId Safety ---");
  const maliciousInput = {
    $where: "malicious code",
    "nested.field": "bad",
    validField: "safe value",
    nestedSafe: { $gt: 10, clean: "ok" },
  };
  const sanitized = sanitizeInput(maliciousInput) as Record<string, unknown>;
  assert(sanitized["$where"] === undefined, "Strips keys starting with $");
  assert(sanitized["nested.field"] === undefined, "Strips keys containing .");
  assert(sanitized.validField === "safe value", "Preserves safe fields");
  const nested = sanitized.nestedSafe as Record<string, unknown>;
  assert(nested["$gt"] === undefined, "Recursively strips malicious keys");
  assert(nested.clean === "ok", "Preserves nested safe keys");

  assert(isValidObjectId("507f1f77bcf86cd799439011") === true, "Validates proper ObjectId");
  assert(isValidObjectId("invalid-id-string") === false, "Rejects malformed ObjectId string");
  assert(isValidObjectId(null) === false, "Handles null ObjectId safely");

  // 2. Test Rate Limiting
  console.log("\n--- 2. Testing Rate Limiting Abstraction ---");
  const key = "test-user-limit";
  let allowedCount = 0;
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(key, { windowMs: 1000, max: 3 });
    if (res.allowed) allowedCount++;
  }
  assert(allowedCount === 3, "Rate limiter allows exactly max requests and rejects excess");

  // 3. Test Content Analyzer (Cleaning & Chunking)
  console.log("\n--- 3. Testing Content Analyzer ---");
  const sampleRawText = `   Inferential statistics allows us to make inferences about a population.\n\n\n\nIt relies on sample data.\r\nStandard error decreases as sample size increases.   `;
  const cleaned = cleanRawText(sampleRawText);
  assert(!cleaned.includes("\r\n"), "Normalizes line endings");
  assert(!cleaned.includes("\n\n\n"), "Compresses consecutive newlines");

  const longText = Array(300).fill("Statistical data analysis methodology.").join(" ");
  const chunks = chunkText(longText, 100);
  assert(chunks.length >= 3, "Chunks long text into semantic pieces");

  const processed = await processLearningMaterialText(longText, "sampling_guide.pdf");
  assert(processed.chunks.length > 0, "Processed chunks generated");
  assert(Array.isArray(processed.topics), "Topics array returned");
  assert(typeof processed.summary === "string", "Summary returned");

  // 4. Test AI Assessment Generator
  console.log("\n--- 4. Testing AI Quiz Generator & Validation ---");
  const mockAssId = new ObjectId();
  const generatedQuestions = await generateQuizQuestions({
    assessmentId: mockAssId,
    topic: "Sampling & Distributions",
    count: 10,
    difficulty: "medium",
  });
  assert(generatedQuestions.length === 10, "Generates exact target count (10 questions)");
  assert(generatedQuestions.every((q) => q.aiGenerated === true), "All questions flagged as aiGenerated: true");
  assert(generatedQuestions.every((q) => q.reviewedByTrainer === false), "All questions flagged as reviewedByTrainer: false (Draft Review Flow)");
  assert(generatedQuestions.every((q) => q.answers.length >= 2), "All questions contain valid answers");
  assert(generatedQuestions.every((q) => q.answers.some((a) => a.isCorrect)), "All questions contain at least one correct answer");

  // 5. Test Competency Analyzer & Improvement Tracking
  console.log("\n--- 5. Testing Competency Analyzer & Improvement Calculations ---");
  const mockUserComps: UserCompetency[] = [
    {
      userId: new ObjectId(),
      competencyId: new ObjectId(),
      currentScore: 78,
      targetScore: 85,
      history: [
        { score: 45, recordedAt: new Date("2026-01-01") },
        { score: 60, recordedAt: new Date("2026-01-15") },
        { score: 78, recordedAt: new Date("2026-02-01") },
      ],
    },
    {
      userId: new ObjectId(),
      competencyId: new ObjectId(),
      currentScore: 42,
      targetScore: 80,
      history: [{ score: 42, recordedAt: new Date("2026-02-01") }],
    },
  ];
  const compReport = analyzeAllUserCompetencies(mockUserComps);
  assert(compReport.totalCompetencies === 2, "Tracks total competencies correctly");
  assert(compReport.strongAreas.length === 1, "Identifies strong areas correctly (score >= 75)");
  assert(compReport.weakAreas.length === 1, "Identifies weak areas correctly (score < 70)");
  assert(compReport.items[0]?.historicalTrend.improvement === 33, "Calculates historical improvement (+33)");

  // 6. Test Evidence-Based Gap Engine
  console.log("\n--- 6. Testing Evidence-Based Gap Engine ---");
  const c1Id = new ObjectId();
  const testCompetencies: Competency[] = [
    { _id: c1Id, name: "Hypothesis Testing", category: "Inference" },
  ];
  const testUserCompetency: UserCompetency[] = [
    {
      userId: new ObjectId(),
      competencyId: c1Id,
      currentScore: 50,
      targetScore: 85,
      history: [{ score: 50, recordedAt: new Date() }],
    },
  ];
  const gapReport = calculateGapAnalysis({
    userId: "test-user",
    userCompetencies: testUserCompetency,
    competencyCatalogue: testCompetencies,
    attempts: [
      {
        userId: new ObjectId(),
        assessmentId: new ObjectId(),
        score: 50,
        evidence: {
          items: [
            { questionText: "Q1", difficulty: "easy", isCorrect: false, competencyId: c1Id.toHexString() },
            { questionText: "Q2", difficulty: "medium", isCorrect: false, competencyId: c1Id.toHexString() },
          ],
        },
        startedAt: new Date(),
      },
    ],
    questionsMap: new Map<string, Question>(),
  });
  assert(gapReport.competencies.length === 1, "Calculates gap report for user competencies");
  assert(gapReport.competencies[0]?.gap === 35, "Calculates exact gap: target 85 - current 50 = 35");
  assert(gapReport.competencies[0]?.severity === "high", "High gap severity assigned for >25 gap with missed foundational question");
  assert(Boolean(gapReport.competencies[0]?.explanation.includes("Critical conceptual gaps identified")), "Evidence-based explanation references foundational error");

  // 7. Test Recommendation Engine
  console.log("\n--- 7. Testing Recommendation Engine ---");
  const sampleCourses: Course[] = [
    {
      _id: new ObjectId(),
      title: "Mastering Hypothesis Testing",
      source: "mock_igot",
      competencyId: c1Id,
    },
  ];
  const recommendations = generateRecommendationsForGaps({
    userId: new ObjectId(),
    gaps: gapReport.competencies,
    availableCourses: sampleCourses,
  });
  assert(recommendations.length > 0, "Generates course recommendations for identified gaps");
  assert(Boolean(recommendations[0]?.reason.includes("Mastering Hypothesis Testing") || recommendations[0]?.reason.includes("Hypothesis Testing")), "Explains recommendation with competency context");
  assert(recommendations[0]?.priority === "high", "Assigns matching priority");

  // 8. Test 4-Week Structured Learning Path Generator
  console.log("\n--- 8. Testing 4-Week Structured Learning Path ---");
  const learningPlan = generateStructuredLearningPath(gapReport.competencies, sampleCourses);
  assert(learningPlan.totalWeeks === 4, "Creates 4-week structured roadmap");
  assert(learningPlan.weeks.week1.theme === "Foundation", "Week 1 is Foundation");
  assert(learningPlan.weeks.week2.theme === "Weak Concept Practice", "Week 2 is Weak Concept Practice");
  assert(learningPlan.weeks.week3.theme === "Applied Practice", "Week 3 is Applied Practice");
  assert(learningPlan.weeks.week4.theme === "Reassessment", "Week 4 is Reassessment");

  console.log("\n==========================================");
  console.log("ALL BACKEND SUITE TESTS PASSED WITH 100% SUCCESS!");
  console.log("==========================================\n");
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
