import * as dotenv from "dotenv";
dotenv.config();

import { MockAuthProvider } from "../src/lib/auth/provider";
import { findUserByEmail, listUsers } from "../src/db/users";
import { getProfileByUserId } from "../src/db/profiles";
import { userCompetenciesCol, learningPathsCol, progressCol } from "../src/db/collections";

async function verifyFullSignupCycle() {
  console.log("=== Verification Step 1: Check existing seeded users ===");
  const seededLearner = await findUserByEmail("learner@statlearn.local");
  const seededTrainer = await findUserByEmail("trainer@statlearn.local");
  const seededAdmin = await findUserByEmail("admin@statlearn.local");

  console.log("Seeded Learner present:", !!seededLearner);
  console.log("Seeded Trainer present:", !!seededTrainer);
  console.log("Seeded Admin present:", !!seededAdmin);

  console.log("\n=== Verification Step 2: Register a fresh user ===");
  const testEmail = "learner.new.test@statlearn.local";
  const testName = "New Test Learner";
  const testPassword = "SecurePassword123!";

  const signupRes = await MockAuthProvider.login({
    email: testEmail,
    password: testPassword,
    name: testName,
  });

  console.log("Signup success:", !!signupRes.session.userId);
  console.log("Session role:", signupRes.session.role);

  console.log("\n=== Verification Step 3: Verify user and profile in DB ===");
  const createdUser = await findUserByEmail(testEmail);
  console.log("User found in DB:", !!createdUser);
  console.log("User email matches:", createdUser?.email === testEmail);
  console.log("User role is learner:", createdUser?.role === "learner");

  const createdProfile = await getProfileByUserId(createdUser!._id!);
  console.log("Profile found in DB:", !!createdProfile);
  console.log("Profile name matches:", createdProfile?.name === testName);
  console.log("Profile skills initialized empty array:", Array.isArray(createdProfile?.existingSkills) && createdProfile?.existingSkills.length === 0);

  console.log("\n=== Verification Step 4: Verify fresh user starts with empty user-specific data ===");
  const ucCol = await userCompetenciesCol();
  const lpCol = await learningPathsCol();
  const progCol = await progressCol();

  const userCompetencies = await ucCol.find({ userId: createdUser!._id }).toArray();
  const learningPaths = await lpCol.find({ userId: createdUser!._id }).toArray();
  const progressRecords = await progCol.find({ userId: createdUser!._id }).toArray();

  console.log("User competencies count for new user (expect 0):", userCompetencies.length);
  console.log("Learning paths count for new user (expect 0):", learningPaths.length);
  console.log("Progress records count for new user (expect 0):", progressRecords.length);

  console.log("\n=== Verification Step 5: Verify seeded users were NOT modified ===");
  const seededLearnerAfter = await findUserByEmail("learner@statlearn.local");
  console.log("Seeded learner email:", seededLearnerAfter?.email);
  console.log("Seeded learner role:", seededLearnerAfter?.role);

  console.log("\n=== Verification Step 6: Cleanup test user ===");
  const { usersCol, profilesCol } = await import("../src/db/collections");
  const uCol = await usersCol();
  const pCol = await profilesCol();
  await uCol.deleteOne({ _id: createdUser!._id });
  await pCol.deleteOne({ userId: createdUser!._id });
  console.log("Cleaned up test user and profile.");

  const clientPromise = (await import("../src/lib/db/client")).default;
  const client = await clientPromise;
  await client.close();

  console.log("\nAll verification steps completed successfully!");
}

verifyFullSignupCycle().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
