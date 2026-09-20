import { MockAuthProvider } from "../src/lib/auth/provider";

async function main() {
  const orgEmail = `org_debug_${Date.now()}@test.local`;
  console.log(`Log in as: ${orgEmail}`);
  const { cookie } = await MockAuthProvider.login({
    email: orgEmail,
    password: "Password123!",
    name: "DEBUG ORG",
    role: "organization",
  });

  const res = await fetch("http://localhost:3000/api/analytics/organization", {
    headers: { cookie }
  });

  const text = await res.text();
  console.log("RESPONSE FROM API:");
  console.log(text);

}
main();