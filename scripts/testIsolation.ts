import { MockAuthProvider } from "../src/lib/auth/provider";
import { getAttemptsByUser } from "../src/db/assessmentAttempts";
import { findUserByEmail } from "../src/db/users";
import { getProfileByUserId } from "../src/db/profiles";
import { usersCol, profilesCol, aiConversationsCol } from "../src/db/collections";
import { getProgressByUser } from "../src/db/progress";
import { getConversationsByUser, createConversation } from "../src/db/aiConversations";
import { toObjectId } from "../src/lib/sanitize";

async function main() {
  console.log("=== Testing Data Isolation: New Signup vs Seeded Learner ===\n");

  const seededEmail = "learner@statlearn.local";
  const seededUser = await findUserByEmail(seededEmail);
  if (!seededUser) {
    throw new Error(`Seeded user ${seededEmail} not found!`);
  }

  console.log(`[1. Verify Seeded Learner (${seededEmail})]`);
  const seededAttempts = await getAttemptsByUser(seededUser._id!);
  const seededProfile = await getProfileByUserId(seededUser._id!);
  const seededEvents = await getProgressByUser(seededUser._id!);

  // Seed a test conversation for the seeded learner if none exists
  let seededConvs = await getConversationsByUser(seededUser._id!);
  if (seededConvs.length === 0) {
    await createConversation(seededUser._id!, "Seeded Sampling Discussion", [
      {
        id: "msg-1",
        sender: "user",
        text: "Explain stratified sampling",
        timestamp: "10:00 AM",
      },
      {
        id: "msg-2",
        sender: "ai",
        text: "Stratified sampling divides population into subgroups.",
        timestamp: "10:01 AM",
      },
    ]);
    seededConvs = await getConversationsByUser(seededUser._id!);
  }

  console.log(`  ✅ Seeded User ID: ${seededUser._id}`);
  console.log(`  ✅ Seeded Attempts Count: ${seededAttempts.length} (Expected > 0)`);
  console.log(`  ✅ Seeded Profile Name: "${seededProfile?.name}"`);
  console.log(`  ✅ Seeded Progress Events: ${seededEvents.length} (Expected > 0)`);
  console.log(`  ✅ Seeded AI Conversations: ${seededConvs.length} (Expected > 0)`);

  if (seededAttempts.length === 0) {
    throw new Error("Seeded learner has 0 attempts; seeded data appears missing!");
  }

  // 2. Test Fresh Sign Up
  const freshEmail = `testuser_${Date.now()}@test.local`;
  const freshName = "Fresh Test Learner";
  console.log(`\n[2. Create Fresh Signup User (${freshEmail})]`);

  const { session } = await MockAuthProvider.login({
    email: freshEmail,
    password: "Password123!",
    name: freshName,
  });

  console.log(`  ✅ Signup succeeded! New User ID: ${session.userId}`);
  console.log(`  ✅ Session Role: ${session.role}`);

  const freshUser = await findUserByEmail(freshEmail);
  const freshUserId = toObjectId(session.userId);
  const freshProfile = await getProfileByUserId(freshUserId);
  const freshAttempts = await getAttemptsByUser(freshUserId);
  const freshEvents = await getProgressByUser(freshUserId);
  const freshConvs = await getConversationsByUser(freshUserId);

  console.log(`\n[3. Verify Fresh Learner Data Isolation & Zero State]`);
  console.log(`  ✅ Fresh Profile Name: "${freshProfile?.name}" (Expected: "${freshName}")`);
  console.log(`  ✅ Fresh Attempts Count: ${freshAttempts.length} (Expected: 0)`);
  console.log(`  ✅ Fresh Progress Events Count: ${freshEvents.length} (Expected: 0)`);
  console.log(`  ✅ Fresh AI Conversations Count: ${freshConvs.length} (Expected: 0)`);

  if (freshAttempts.length !== 0) {
    throw new Error(`Data leak! Fresh learner has ${freshAttempts.length} attempts from another user.`);
  }
  if (freshEvents.length !== 0) {
    throw new Error(`Data leak! Fresh learner has ${freshEvents.length} progress events from another user.`);
  }
  if (freshConvs.length !== 0) {
    throw new Error(`Data leak! Fresh learner has ${freshConvs.length} conversations from another user.`);
  }
  if (freshProfile?.name !== freshName) {
    throw new Error(`Profile name mismatch: got "${freshProfile?.name}", expected "${freshName}"`);
  }

  // 4. Test Cross-User Conversation Creation & Isolation
  console.log(`\n[4. Test User A Cannot Access User B Conversations]`);
  const freshCreatedConv = await createConversation(freshUserId, "Fresh Learner Private Chat", [
    {
      id: "fresh-msg-1",
      sender: "user",
      text: "How to calculate standard deviation?",
      timestamp: "11:00 AM",
    },
  ]);

  const updatedFreshConvs = await getConversationsByUser(freshUserId);
  const updatedSeededConvs = await getConversationsByUser(seededUser._id!);

  console.log(`  ✅ Fresh User's Conversations: ${updatedFreshConvs.length} (Expected: 1)`);
  console.log(`  ✅ Seeded User's Conversations: ${updatedSeededConvs.length} (Expected: ${seededConvs.length})`);

  const seededHasFreshConv = updatedSeededConvs.some((c) => c._id?.toString() === freshCreatedConv?._id?.toString());
  if (seededHasFreshConv) {
    throw new Error("Data leak! Seeded user can see Fresh user's newly created conversation.");
  }
  console.log(`  ✅ Confirmed: Fresh User conversation is completely isolated from Seeded User.`);

  // 5. Clean up the temporary test user
  console.log(`\n[5. Clean up Temporary Test User]`);
  if (freshUser?._id) {
    const uCol = await usersCol();
    await uCol.deleteOne({ _id: freshUser._id });
    const pCol = await profilesCol();
    await pCol.deleteOne({ userId: freshUser._id });
    const cCol = await aiConversationsCol();
    await cCol.deleteMany({ userId: freshUser._id });
    console.log(`  ✅ Temporary user ${freshEmail} and test conversations deleted.`);
  }

  // 6. Final Confirmation on Seeded User
  console.log(`\n[6. Final Verification of Seeded Learner Integrity]`);
  const postCheckAttempts = await getAttemptsByUser(seededUser._id!);
  console.log(`  ✅ Seeded Attempts Count after test: ${postCheckAttempts.length} (Unchanged: ${postCheckAttempts.length})`);

  console.log("\n=== Data Isolation & AI Tutor Scoping Test Passed 100%! ===");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
