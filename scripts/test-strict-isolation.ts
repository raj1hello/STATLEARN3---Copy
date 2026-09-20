import { MockAuthProvider } from "../src/lib/auth/provider";
import { findUserByEmail } from "../src/db/users";
import { usersCol, profilesCol, parentLinksCol, userCompetenciesCol, assessmentAttemptsCol } from "../src/db/collections";
import { toObjectId } from "../src/lib/sanitize";

// A mock Next.js Request for the GET handlers
function createMockRequest(sessionCookie: string) {
  return new Request("http://localhost:3000/api", {
    headers: new Headers({
      cookie: sessionCookie,
    }),
  });
}

async function main() {
  console.log("=== Testing Strict New-Account Data Isolation Across Roles ===\n");

  // TEST A: Create Organization A
  const orgAEmail = `orgA_${Date.now()}@test.local`;
  console.log(`[TEST A] Creating Organization A (${orgAEmail})...`);
  const { session: sessionOrgA, cookie: cookieOrgA } = await MockAuthProvider.login({
    email: orgAEmail,
    password: "Password123!",
    name: "New Organization A",
    role: "organization",
  });

  const { GET: orgAnalyticsGET } = await import("../src/app/api/analytics/organization/route");

  const orgAReq = createMockRequest(cookieOrgA);
  const orgARes = await orgAnalyticsGET(orgAReq);
  const orgAData = (await orgARes.json()).data;

  console.log("Organization A Dashboard Analytics (Fresh):", JSON.stringify(orgAData.overview));
  if (orgAData.overview.totalStudents !== 0 || orgAData.overview.averageAssessmentScore !== 0) {
    throw new Error("TEST A Failed: Organization A does not have completely empty dashboard overview.");
  }
  if (orgAData.skillDistribution.length !== 0 || orgAData.streamDistribution.length !== 0 || orgAData.performanceTrends.length !== 0) {
    throw new Error("TEST A Failed: Organization A does not have empty chart data arrays.");
  }
  console.log("✅ TEST A Passed: Organization A dashboard is completely empty and real values are ZERO/[] directly from the API.\n");

  // TEST B: Create Organization B
  const orgBEmail = `orgB_${Date.now()}@test.local`;
  console.log(`[TEST B] Creating Organization B (${orgBEmail})...`);
  const { session: sessionOrgB, cookie: cookieOrgB } = await MockAuthProvider.login({
    email: orgBEmail,
    password: "Password123!",
    name: "New Organization B",
    role: "organization",
  });

  const orgBReq = createMockRequest(cookieOrgB);
  const orgBRes = await orgAnalyticsGET(orgBReq);
  const orgBData = (await orgBRes.json()).data;

  if (orgBData.overview.totalStudents !== 0 || orgBData.overview.averageAssessmentScore !== 0) {
    throw new Error("TEST B Failed: Organization B does not have completely empty dashboard overview.");
  }
  console.log("✅ TEST B Passed: Organization B dashboard is completely empty.\n");

  // TEST C: Add/connect a trainer to Organization A
  const trainerAEmail = `trainerA_${Date.now()}@test.local`;
  console.log(`[TEST C] Creating Trainer A (${trainerAEmail}) assigned to Organization A...`);
  const { session: sessionTrainerA } = await MockAuthProvider.login({
    email: trainerAEmail,
    password: "Password123!",
    name: "Trainer A1",
    role: "trainer",
  });

  // Assign Trainer A specifically to Organization A
  const pCol = await profilesCol();
  const trainerAUserId = toObjectId(sessionTrainerA.userId);
  await pCol.updateOne(
    { userId: trainerAUserId },
    { $set: { organizationId: toObjectId(sessionOrgA.userId) } }
  );

  const { GET: orgTrainersGET } = await import("../src/app/api/organization/trainers/route");

  // Org A API Call
  const orgATrainersRes = await orgTrainersGET(createMockRequest(cookieOrgA));
  const orgATrainersData = (await orgATrainersRes.json()).data;

  // Org B API Call
  const orgBTrainersRes = await orgTrainersGET(createMockRequest(cookieOrgB));
  const orgBTrainersData = (await orgBTrainersRes.json()).data;

  console.log(`  Org A Trainers: ${orgATrainersData.trainers.length} (${orgATrainersData.trainers[0]?.name})`);
  console.log(`  Org B Trainers: ${orgBTrainersData.trainers.length}`);

  if (orgATrainersData.trainers.length !== 1 || orgATrainersData.trainers[0].name !== "Trainer A1") {
    throw new Error("TEST C Failed: Organization A cannot see Trainer A1.");
  }
  if (orgBTrainersData.trainers.length !== 0) {
    throw new Error("TEST C Failed: Organization B saw Trainer A1 (Tenant Leak!).");
  }
  console.log("✅ TEST C Passed: Organization A sees Trainer A1; Organization B does NOT.\n");

  // TEST D: Add/connect a learner to Organization A
  const learnerAEmail = `learnerA_${Date.now()}@test.local`;
  console.log(`[TEST D] Creating Learner A (${learnerAEmail}) assigned to Organization A...`);
  const { session: sessionLearnerA } = await MockAuthProvider.login({
    email: learnerAEmail,
    password: "Password123!",
    name: "Learner A1",
    role: "learner",
  });

  // Assign Learner A specifically to Organization A and ensure they shared their profile
  const learnerAUserId = toObjectId(sessionLearnerA.userId);
  await pCol.updateOne(
    { userId: learnerAUserId },
    { $set: {
      organizationId: toObjectId(sessionOrgA.userId),
      shareProfileWithOrganizations: true
    } }
  );

  const { GET: orgStudentsGET } = await import("../src/app/api/organization/students/route");

  const orgAStudentsRes = await orgStudentsGET(createMockRequest(cookieOrgA));
  const orgAStudentsData = (await orgAStudentsRes.json()).data;

  const orgBStudentsRes = await orgStudentsGET(createMockRequest(cookieOrgB));
  const orgBStudentsData = (await orgBStudentsRes.json()).data;

  console.log(`  Org A Learners: ${orgAStudentsData.students.length} (${orgAStudentsData.students[0]?.name})`);
  console.log(`  Org B Learners: ${orgBStudentsData.students.length}`);

  if (orgAStudentsData.students.length !== 1 || orgAStudentsData.students[0].name !== "Learner A1") {
    throw new Error("TEST D Failed: Organization A cannot see Learner A1.");
  }
  if (orgBStudentsData.students.length !== 0) {
    throw new Error("TEST D Failed: Organization B saw Learner A1 (Tenant Leak!).");
  }
  console.log("✅ TEST D Passed: Organization A sees Learner A1; Organization B does NOT.\n");

  // TEST E, F, G: Create Brand New Learner, Trainer, Parent
  console.log(`[TEST E, F, G] Creating brand new Learner, Trainer, Parent accounts...`);

  // New Learner
  const newLearnerEmail = `newLearner_${Date.now()}@test.local`;
  const { session: learnerSession, cookie: learnerCookie } = await MockAuthProvider.login({ email: newLearnerEmail, password: "pw", role: "learner" });
  const { GET: learnerAnalyticsGET } = await import("../src/app/api/analytics/learner/route");
  const lRes = await learnerAnalyticsGET(createMockRequest(learnerCookie));
  const lData = (await lRes.json()).data;
  if ((lData.recentProgressEvents?.length || 0) !== 0 || (lData.competencies?.all?.length || 0) !== 0) {
    throw new Error("TEST E Failed: New Learner inherited previous data.");
  }
  console.log("✅ TEST E Passed: New Learner starts with completely clean state.");

  // New Trainer
  const newTrainerEmail = `newTrainer_${Date.now()}@test.local`;
  const { session: trainerSession, cookie: trainerCookie } = await MockAuthProvider.login({ email: newTrainerEmail, password: "pw", role: "trainer" });
  const { GET: trainerLearnersGET } = await import("../src/app/api/trainer/learners/route");
  const tRes = await trainerLearnersGET(createMockRequest(trainerCookie));
  const tData = (await tRes.json()).data;
  if ((tData.learners?.length || 0) !== 0 || (tData.connections?.length || 0) !== 0) {
    throw new Error("TEST F Failed: New Trainer inherited previous connections.");
  }
  console.log("✅ TEST F Passed: New Trainer starts with zero assigned learners.");

  // New Parent
  const newParentEmail = `newParent_${Date.now()}@test.local`;
  const { session: parentSession, cookie: parentCookie } = await MockAuthProvider.login({ email: newParentEmail, password: "pw", role: "parent" });
  const { GET: parentLinksGET } = await import("../src/app/api/parent/links/route");
  const pRes = await parentLinksGET(createMockRequest(parentCookie));
  const parentData = (await pRes.json()).data;
  if ((parentData.links?.length || 0) !== 0) {
    throw new Error("TEST G Failed: New Parent inherited previous linked learners.");
  }
  console.log("✅ TEST G Passed: New Parent starts with zero linked learners.\n");

  // TEST H: Learner sends Parent connection request
  console.log(`[TEST H] Learner sends Parent connection request...`);
  const { POST: parentLinksPOST } = await import("../src/app/api/parent/links/route");
  const requestBody = JSON.stringify({ email: newParentEmail, relation: "Mother", customRelation: "" });
  const reqPost = new Request("http://localhost:3000/api", {
    method: "POST",
    headers: new Headers({ "cookie": learnerCookie, "content-type": "application/json" }),
    body: requestBody
  });

  const postRes = await parentLinksPOST(reqPost);
  const postData = await postRes.json();
  if (!postData.success) {
    throw new Error(`TEST H Failed: Could not send parent request. Error: ${JSON.stringify(postData)}`);
  }

  // Parent checks requests
  const pRes2 = await parentLinksGET(createMockRequest(parentCookie));
  const parentData2 = (await pRes2.json()).data;
  if (parentData2.links.length !== 1 || parentData2.links[0].status !== "pending") {
    throw new Error("TEST H Failed: Parent did not receive the pending connection request.");
  }
  console.log("✅ TEST H Passed: Learner -> Parent request flow works flawlessly.\n");

  // TEST I: Verify session isolation after 'logout' (creating another new org)
  console.log(`[TEST I] Verifying isolation of a fresh Organization after others created...`);
  const orgCEmail = `orgC_${Date.now()}@test.local`;
  const { cookie: cookieOrgC } = await MockAuthProvider.login({
    email: orgCEmail,
    password: "Password123!",
    name: "New Organization C",
    role: "organization",
  });

  const orgCRes = await orgAnalyticsGET(createMockRequest(cookieOrgC));
  const orgCData = (await orgCRes.json()).data;
  if (orgCData.overview.totalStudents !== 0 || orgCData.overview.averageAssessmentScore !== 0) {
    throw new Error("TEST I Failed: Fresh Organization C inherited data from Organization A or B.");
  }
  console.log("✅ TEST I Passed: New Organization C has ZERO data from Org A or Org B.\n");

  // Cleanup
  console.log("Cleaning up test accounts...");
  const uCol = await usersCol();
  const emails = [orgAEmail, orgBEmail, trainerAEmail, learnerAEmail, newLearnerEmail, newTrainerEmail, newParentEmail, orgCEmail];
  await uCol.deleteMany({ email: { $in: emails } });

  const pLinks = await parentLinksCol();
  await pLinks.deleteMany({ parentInfo: newParentEmail }); // Cleanup parent links

  console.log("Test documents deleted.");

  console.log("\n=======================================================");
  console.log("ALL TESTS (A through I) PASSED WITH STRICT ISOLATION.");
  console.log("=======================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
