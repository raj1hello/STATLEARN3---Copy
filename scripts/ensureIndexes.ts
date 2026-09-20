import * as dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set in environment");
  process.exit(1);
}

async function ensureIndexes() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully for index creation");
    const db = client.db();

    // 1. users: email -> unique
    console.log("Creating indexes for 'users'...");
    await db.collection("users").createIndex({ email: 1 }, { unique: true, name: "idx_users_email_unique" });

    // 2. profiles: userId -> unique
    console.log("Creating indexes for 'profiles'...");
    await db.collection("profiles").createIndex({ userId: 1 }, { unique: true, name: "idx_profiles_userId_unique" });

    // 3. user_competencies: (userId, competencyId) -> unique
    console.log("Creating indexes for 'user_competencies'...");
    await db.collection("user_competencies").createIndex(
      { userId: 1, competencyId: 1 },
      { unique: true, name: "idx_user_competencies_userId_competencyId_unique" }
    );
    await db.collection("user_competencies").createIndex({ userId: 1 });

    // 4. competencies: name
    console.log("Creating indexes for 'competencies'...");
    await db.collection("competencies").createIndex({ name: 1 });

    // 5. assessments
    console.log("Creating indexes for 'assessments'...");
    await db.collection("assessments").createIndex({ createdById: 1 });
    await db.collection("assessments").createIndex({ competencyId: 1 });
    await db.collection("assessments").createIndex({ published: 1 });

    // 6. questions
    console.log("Creating indexes for 'questions'...");
    await db.collection("questions").createIndex({ assessmentId: 1 });
    await db.collection("questions").createIndex({ competencyId: 1 });

    // 7. assessment_attempts
    console.log("Creating indexes for 'assessment_attempts'...");
    await db.collection("assessment_attempts").createIndex({ userId: 1 });
    await db.collection("assessment_attempts").createIndex({ assessmentId: 1 });
    await db.collection("assessment_attempts").createIndex({ userId: 1, assessmentId: 1 });

    // 8. courses
    console.log("Creating indexes for 'courses'...");
    await db.collection("courses").createIndex({ source: 1 });
    await db.collection("courses").createIndex({ competencyId: 1 });

    // 9. learning_paths
    console.log("Creating indexes for 'learning_paths'...");
    await db.collection("learning_paths").createIndex({ userId: 1 });
    await db.collection("learning_paths").createIndex({ status: 1 });

    // 10. recommendations
    console.log("Creating indexes for 'recommendations'...");
    await db.collection("recommendations").createIndex({ userId: 1 });

    // 11. learning_materials
    console.log("Creating indexes for 'learning_materials'...");
    await db.collection("learning_materials").createIndex({ uploadedById: 1 });

    // 12. progress
    console.log("Creating indexes for 'progress'...");
    await db.collection("progress").createIndex({ userId: 1 });
    await db.collection("progress").createIndex({ recordedAt: -1 });

    // 13. search_history
    console.log("Creating indexes for 'search_history'...");
    await db.collection("search_history").createIndex({ userId: 1 });
    await db.collection("search_history").createIndex({ userId: 1, createdAt: -1 });

    // 14. streams
    console.log("Creating indexes for 'streams'...");
    await db.collection("streams").createIndex({ slug: 1 }, { unique: true });

    // 15. mock_interviews
    console.log("Creating indexes for 'mock_interviews'...");
    await db.collection("mock_interviews").createIndex({ userId: 1 });
    await db.collection("mock_interviews").createIndex({ userId: 1, startedAt: -1 });

    // 16. assessments stream indexing
    await db.collection("assessments").createIndex({ stream: 1 });
    await db.collection("assessments").createIndex({ kind: 1 });

    console.log("All indexes ensured successfully!");
  } catch (error) {
    console.error("Failed to ensure indexes:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

ensureIndexes();
