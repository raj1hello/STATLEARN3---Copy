import { MockAuthProvider } from "../src/lib/auth/provider";
async function main() {
  const { cookie } = await MockAuthProvider.login({
    email: "orgC_curl_test@test.local",
    password: "Password123!",
    name: "Org Curl",
    role: "organization",
  });
  console.log(cookie);
  process.exit(0);
}
main();