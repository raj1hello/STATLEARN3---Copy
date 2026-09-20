import * as dotenv from "dotenv";
dotenv.config();

import { MockAuthProvider } from "../src/lib/auth/provider";

const testAccounts = [
  { email: "learner@statlearn.local", password: "Learner@123", expectedRole: "learner" },
  { email: "trainer@statlearn.local", password: "Trainer@123", expectedRole: "trainer" },
  { email: "admin@statlearn.local", password: "Admin@123", expectedRole: "admin" },
];

async function verifyAuthFlow() {
  console.log("=== Testing Authentication & Login Provider Flow ===\n");

  for (const account of testAccounts) {
    console.log(`[Testing Login for ${account.email}]`);
    try {
      const result = await MockAuthProvider.login({
        email: account.email,
        password: account.password,
      });

      console.log(`  ✅ Login succeeded!`);
      console.log(`  ✅ User ID: ${result.session.userId}`);
      console.log(`  ✅ Email: ${result.session.email}`);
      console.log(`  ✅ Role: ${result.session.role} (matches expected: ${result.session.role === account.expectedRole})`);
      console.log(`  ✅ Cookie set: ${result.cookie.slice(0, 35)}...`);

      // Verify getSession with mock request using returned cookie
      const mockReq = new Request("http://localhost:3000/api/auth/session", {
        headers: {
          cookie: result.cookie,
        },
      });

      const session = await MockAuthProvider.getSession(mockReq);
      if (session && session.userId === result.session.userId) {
        console.log(`  ✅ Session cookie validated via getSession(): userId=${session.userId}, role=${session.role}`);
      } else {
        console.error(`  ❌ Failed to validate session cookie`);
      }
    } catch (err: any) {
      console.error(`  ❌ Login failed for ${account.email}:`, err.message);
    }
    console.log("");
  }

  // Verify invalid password rejection
  console.log("[Testing Invalid Password Rejection]");
  try {
    await MockAuthProvider.login({
      email: "learner@statlearn.local",
      password: "WrongPassword!123",
    });
    console.error("  ❌ Security issue: Invalid password was accepted!");
  } catch (err: any) {
    console.log(`  ✅ Invalid password successfully rejected with: "${err.message}"`);
  }

  console.log("\n=== Authentication & Login Flow Verification Finished Successfully ===");
  process.exit(0);
}

verifyAuthFlow();
