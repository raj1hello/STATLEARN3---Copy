import * as dotenv from "dotenv";
dotenv.config();

import { MockAuthProvider } from "../src/lib/auth/provider";
import { findUserByEmail } from "../src/db/users";
import { getProfileByUserId } from "../src/db/profiles";
import { usersCol, profilesCol } from "../src/db/collections";

async function test() {
  console.log("Testing MockAuthProvider.login simulation...");
  const testEmail = "test_tls_check_" + Date.now() + "@statlearn.local";
  try {
    const res = await MockAuthProvider.login({
      email: testEmail,
      password: "TestPassword123!",
      name: "TLS Test User",
    });
    console.log("MockAuthProvider.login SUCCESS! UserId:", res.session.userId);

    // Check if user was created in MongoDB
    const user = await findUserByEmail(testEmail);
    console.log("User found in MongoDB:", user ? "YES" : "NO", user?.email);

    // Check if profile was created in MongoDB
    const profile = await getProfileByUserId(res.session.userId);
    console.log("Profile found in MongoDB:", profile ? "YES" : "NO", profile?.name);

    // Clean up test user and profile
    const uCol = await usersCol();
    const pCol = await profilesCol();
    await uCol.deleteOne({ email: testEmail });
    if (user?._id) {
      await pCol.deleteOne({ userId: user._id });
    }
    console.log("Cleaned up test user and profile.");
  } catch (err) {
    console.error("MockAuthProvider.login ERROR:", err);
  } finally {
    const clientPromise = (await import("../src/lib/db/client")).default;
    const client = await clientPromise;
    await client.close();
  }
}

test();
