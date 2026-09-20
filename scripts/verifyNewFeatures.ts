import * as dotenv from "dotenv";
dotenv.config();

import { MongoClient, ObjectId } from "mongodb";
import { recordSearch, getSearchHistory, deleteSearchEntry, clearUserSearchHistory } from "../src/db/searchHistory";
import { listStreams, getStreamBySlug, seedDefaultStreams } from "../src/db/streams";
import { createMockInterview, getMockInterviewById, listMockInterviewsByUser, completeMockInterview } from "../src/db/mockInterviews";
import { listConsentingStudentProfiles, getConsentingStudentProfile, upsertProfile } from "../src/db/profiles";
import { generateFirstQuestion, evaluateAnswerAndGenerateNext, generateFinalInterviewReport } from "../src/lib/ai/mockInterviewEngine";

async function verifyAll() {
  console.log("==================================================");
  console.log("RUNNING VERIFICATION FOR 5 EXPANDED FEATURES");
  console.log("==================================================\n");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const testLearnerId = new ObjectId();
  const otherLearnerId = new ObjectId();

  try {
    // 1. VERIFY SEARCH HISTORY
    console.log("--- 1. Testing Student Search History ---");
    const s1 = await recordSearch(testLearnerId, "Sampling Theory");
    const s2 = await recordSearch(testLearnerId, "Hypothesis Testing");
    const otherS = await recordSearch(otherLearnerId, "Other Student Secret Search");

    let history = await getSearchHistory(testLearnerId);
    console.log(`✓ Recorded 2 searches for learner. Found in history: ${history.length} items.`);
    if (history.length !== 2) throw new Error("Search history length mismatch");

    // Verify isolation: other student's search must not appear
    const containsOther = history.some((h) => h.query.includes("Other Student"));
    if (containsOther) throw new Error("Search history isolation violation!");
    console.log("✓ Verified user-specific isolation: Other student's searches never appear.");

    // Delete single entry
    const deleted = await deleteSearchEntry(testLearnerId, s1._id!);
    history = await getSearchHistory(testLearnerId);
    console.log(`✓ Deleted single search entry. Remaining: ${history.length}.`);
    if (history.length !== 1 || !deleted) throw new Error("Delete single search entry failed");

    // Clear all history
    await clearUserSearchHistory(testLearnerId);
    history = await getSearchHistory(testLearnerId);
    console.log(`✓ Cleared all history for user. Remaining: ${history.length}.`);
    if (history.length !== 0) throw new Error("Clear all search history failed");

    // 2. VERIFY STREAMS
    console.log("\n--- 2. Testing Stream-Based Tests ---");
    await seedDefaultStreams();
    const streams = await listStreams();
    console.log(`✓ Listed ${streams.length} dynamic streams: ${streams.map((s) => s.slug).join(", ")}`);
    if (streams.length === 0) throw new Error("No streams available");

    const statStream = await getStreamBySlug("statistics");
    if (!statStream) throw new Error("Failed to find statistics stream");
    console.log(`✓ Retrieved stream '${statStream.slug}': "${statStream.title}" with ${statStream.skills?.length} skills`);

    // 3. VERIFY INDUSTRY COLLABORATION & PRIVACY CONSENT
    console.log("\n--- 3. Testing Industry Collaboration & Privacy Consent ---");
    const consentingStudentId = new ObjectId();
    const privateStudentId = new ObjectId();

    await upsertProfile(consentingStudentId, {
      name: "Consenting Student",
      stream: "statistics",
      existingSkills: ["Probability", "Python"],
      shareProfileWithOrganizations: true,
    });

    await upsertProfile(privateStudentId, {
      name: "Private Student",
      stream: "statistics",
      existingSkills: ["Confidential Skills"],
      shareProfileWithOrganizations: false,
    });

    const discoverableProfiles = await listConsentingStudentProfiles();
    const discoverableIds = discoverableProfiles.map((p) => p.userId.toString());

    if (!discoverableIds.includes(consentingStudentId.toString())) {
      throw new Error("Consenting student was not found in organization discovery list!");
    }
    if (discoverableIds.includes(privateStudentId.toString())) {
      throw new Error("PRIVACY VIOLATION: Private student appeared in organization discovery list!");
    }
    console.log("✓ Privacy Rule Verified: Unconsented student is strictly excluded from organization talent discovery.");

    const privateCheck = await getConsentingStudentProfile(privateStudentId);
    if (privateCheck !== null) {
      throw new Error("Private profile direct access should return null!");
    }
    console.log("✓ Direct inspection of unconsented student safely returns null.");

    // 4. VERIFY AI MOCK INTERVIEW ENGINE & HISTORY
    console.log("\n--- 4. Testing AI Mock Interview Engine & Isolation ---");
    const q1 = await generateFirstQuestion({
      targetRole: "Statistical Analyst",
      difficulty: "intermediate",
    });
    console.log(`✓ Generated first question for Statistical Analyst: "${q1.question.slice(0, 80)}..."`);
    if (!q1.question) throw new Error("Failed to generate first interview question");

    const interview = await createMockInterview({
      userId: testLearnerId,
      targetRole: "Statistical Analyst",
      difficulty: "intermediate",
      maxQuestions: 3,
      initialQuestion: q1,
    });
    console.log(`✓ Created mock interview session ID: ${interview._id}`);

    const evalResult = await evaluateAnswerAndGenerateNext({
      targetRole: "Statistical Analyst",
      difficulty: "intermediate",
      questionNumber: 1,
      totalQuestions: 3,
      currentQuestion: q1,
      userAnswer: "In statistical analysis, I rely on the Central Limit Theorem to calculate confidence intervals and verify normality assumptions before applying regression models.",
      previousQuestions: [q1],
    });
    console.log(`✓ Evaluated candidate answer: Relevance=${evalResult.evaluation.relevanceScore}%, Tech=${evalResult.evaluation.technicalAccuracyScore}%`);
    console.log(`✓ Generated follow-up Q2: "${evalResult.nextQuestion?.question?.slice(0, 80)}..."`);

    const finalReport = await generateFinalInterviewReport({
      targetRole: "Statistical Analyst",
      difficulty: "intermediate",
      questions: [
        {
          ...q1,
          userAnswer: "I use hypothesis testing and p-values to control Type I error.",
          evaluation: evalResult.evaluation,
        },
      ],
    });
    console.log(`✓ Generated Final Structured Report: Overall Score=${finalReport.overallScore}%, Summary="${finalReport.summary.slice(0, 70)}..."`);
    if (!finalReport.overallScore || !finalReport.strengths) {
      throw new Error("Final report format invalid");
    }

    await completeMockInterview(interview._id!, finalReport, 180);
    const userInterviews = await listMockInterviewsByUser(testLearnerId);
    console.log(`✓ Listed user mock interviews: ${userInterviews.length} completed session(s).`);

    // Verify isolation of mock interviews
    const otherInterviews = await listMockInterviewsByUser(otherLearnerId);
    if (otherInterviews.length !== 0) {
      throw new Error("Mock interview isolation violation!");
    }
    console.log("✓ Verified mock interview isolation: Student can only access their own interview sessions.");

    console.log("\n==================================================");
    console.log("ALL 5 FEATURES VERIFIED AND PASSING SUCCESSFULLY!");
    console.log("==================================================");
  } finally {
    // Clean up test records
    await clearUserSearchHistory(testLearnerId);
    await clearUserSearchHistory(otherLearnerId);
    await client.close();
  }
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
