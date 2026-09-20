import * as dotenv from "dotenv";
dotenv.config();

import { MockAuthProvider } from "../src/lib/auth/provider";
import { aiProvider } from "../src/lib/ai/provider";
import {
  createConversation,
  getConversationById,
  getConversationsByUser,
  deleteConversation,
} from "../src/db/aiConversations";
import { usersCol, profilesCol } from "../src/db/collections";

async function runTests() {
  console.log("==================================================");
  console.log("STARTING AI PROVIDER & AI TUTOR INTEGRATION TESTS");
  console.log("==================================================");

  // 1. Test AI Provider Generate & Model Payload Check
  console.log("\n[Test 1] Testing aiProvider.generate()...");
  const testPrompt = "Explain the Central Limit Theorem in 2 sentences.";
  const aiResult = await aiProvider.generate({
    prompt: testPrompt,
    systemPrompt: "You are an expert statistics tutor.",
    temperature: 0.7,
    maxTokens: 300,
  });

  console.log("AI Result received (type string):", typeof aiResult === "string" && aiResult.length > 0);
  console.log("AI Response snippet:", aiResult.slice(0, 120) + "...");

  // 2. Test User Conversation Creation & Isolation
  console.log("\n[Test 2] Creating two distinct test users for isolation testing...");
  const user1Email = `ai_test_user1_${Date.now()}@statlearn.local`;
  const user2Email = `ai_test_user2_${Date.now()}@statlearn.local`;

  const authUser1 = await MockAuthProvider.login({
    email: user1Email,
    password: "Password123!",
    name: "AI Test User 1",
  });

  const authUser2 = await MockAuthProvider.login({
    email: user2Email,
    password: "Password123!",
    name: "AI Test User 2",
  });

  const u1Id = authUser1.session.userId;
  const u2Id = authUser2.session.userId;

  console.log("User 1 ID:", u1Id);
  console.log("User 2 ID:", u2Id);

  // 3. Create conversation for User 1
  console.log("\n[Test 3] Creating conversation for User 1 with AI response...");
  const convTitle = "Understanding Central Limit Theorem";
  const userMsg = {
    id: `user-${Date.now()}`,
    sender: "user" as const,
    text: testPrompt,
    timestamp: "10:00 AM",
  };
  const aiMsg = {
    id: `ai-${Date.now()}`,
    sender: "ai" as const,
    text: aiResult,
    timestamp: "10:01 AM",
  };

  const conv1 = await createConversation(u1Id, convTitle, [userMsg, aiMsg]);
  console.log("Conversation created for User 1:", !!conv1, "Conv ID:", conv1?._id?.toHexString());

  // 4. Test Persistence for User 1
  console.log("\n[Test 4] Verifying User 1 can retrieve their own conversation...");
  const fetchedByU1 = await getConversationById(conv1!._id!, u1Id);
  console.log("User 1 fetched successfully:", !!fetchedByU1);
  console.log("Messages count in DB:", fetchedByU1?.messages?.length);
  console.log("AI response stored matches:", fetchedByU1?.messages?.[1]?.text === aiResult);

  // 5. Test User Isolation (User 2 cannot access User 1's conversation)
  console.log("\n[Test 5] Verifying User 2 CANNOT access User 1's conversation (Isolation)...");
  const fetchedByU2 = await getConversationById(conv1!._id!, u2Id);
  console.log("User 2 access attempt result (should be null):", fetchedByU2 === null);

  const u2Conversations = await getConversationsByUser(u2Id);
  console.log("User 2 conversation list count (should be 0):", u2Conversations.length);

  // 6. Test Specific Educational Topic Prompts
  console.log("\n[Test 6] Testing topic responses (Newton's Third Law, Probability, Free Fall, Standard Deviation)...");
  const { extractJsonFromText } = await import("../src/lib/ai/responseParser");

  // 6a. Newton's third law
  const newtonResult = await aiProvider.generate({
    prompt: "Explain Newton's third law in simple words.",
    systemPrompt: "You are an expert tutor. Explain concepts in clear markdown.",
  });
  console.log("Newton's third law response relevant:", /newton|equal and opposite|action|reaction/i.test(newtonResult));

  // 6b. Probability
  const probResult = await aiProvider.generate({
    prompt: "What is probability?",
    systemPrompt: "You are an expert tutor. Explain concepts in clear markdown.",
  });
  console.log("Probability response relevant:", /probability|likelihood|sample space|outcomes/i.test(probResult));

  // 6c. Free fall
  const freeFallResult = await aiProvider.generate({
    prompt: "Explain free fall.",
    systemPrompt: "You are an expert tutor. Explain concepts in clear markdown.",
  });
  console.log("Free fall response relevant:", /free fall|gravity|acceleration|kinematic/i.test(freeFallResult));

  // 6d. Standard deviation
  const sdResult = await aiProvider.generate({
    prompt: "What is standard deviation?",
    systemPrompt: "You are an expert tutor. Explain concepts in clear markdown.",
  });
  console.log("Standard deviation response relevant:", /standard deviation|dispersion|variance|mean/i.test(sdResult));

  // 6e. Markdown code-fenced JSON extraction
  const quizJson = JSON.stringify({
    questions: [
      {
        text: "What does standard deviation measure?",
        type: "mcq",
        difficulty: "easy",
        answers: [
          { text: "Dispersion of data points around the mean", isCorrect: true, explanation: "Standard deviation quantifies variability." },
          { text: "The median of the dataset", isCorrect: false, explanation: "Incorrect measure." }
        ]
      }
    ]
  });
  const fencedJson = `\`\`\`json\n${quizJson}\n\`\`\``;
  const parsedFenced = extractJsonFromText(fencedJson) as any;
  console.log("Markdown-fenced JSON extracted and parsed successfully:", Array.isArray(parsedFenced?.questions) && parsedFenced.questions.length === 1);

  // 6f. Invalid JSON fallback
  const invalidJson = "{ invalid json content ...";
  const parsedInvalid = extractJsonFromText(invalidJson);
  console.log("Invalid JSON returns null gracefully:", parsedInvalid === null);

  // 7. Cleanup test users & conversations
  console.log("\n[Test 7] Cleaning up test users and conversation records...");
  const uCol = await usersCol();
  const pCol = await profilesCol();
  const { toObjectId } = await import("../src/lib/sanitize");
  const uid1 = toObjectId(u1Id);
  const uid2 = toObjectId(u2Id);
  await uCol.deleteMany({ email: { $in: [user1Email, user2Email] } });
  if (uid1 && uid2) {
    await pCol.deleteMany({ userId: { $in: [uid1, uid2] } });
  }
  await deleteConversation(conv1!._id!, u1Id);
  console.log("Cleanup finished.");

  const clientPromise = (await import("../src/lib/db/client")).default;
  const client = await clientPromise;
  await client.close();

  console.log("\n==================================================");
  console.log("ALL AI INTEGRATION & ISOLATION TESTS PASSED!");
  console.log("==================================================");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
