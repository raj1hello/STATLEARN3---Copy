// Direct API test — mimics what the modal's load() does
import { parentLinksApi } from "./src/lib/api/client";

async function main() {
  console.log("=== Testing parentLinksApi.list() ===\n");

  const res = await parentLinksApi.list();
  console.log("API response success:", res.success);
  console.log("Has data:", !!res.data);
  if (!res.data) {
    console.log("Error:", res.error);
    return;
  }

  console.log("\nResponse shape keys:", Object.keys(res.data));
  console.log("Viewer:", res.data.viewer);
  console.log("Links count:", res.data.links?.length ?? "undefined");
  console.log("Requests count:", res.data.requests?.length ?? "undefined");
  console.log("Total:", res.data.total);

  const links = res.data.links || [];
  const requests = res.data.requests || [];

  console.log("\n=== Links (parent perspective) ===");
  for (const l of links) {
    console.log(`  id=${l.id} status=${l.status} requestedBy=${l.requestedBy} learnerName=${l.learnerName}`);
  }

  console.log("\n=== Requests (learner perspective) ===");
  for (const r of requests) {
    console.log(`  id=${r.id} status=${r.status} requestedBy=${r.requestedBy} parentName=${r.parentName}`);
  }

  const learnerPending = links.filter(l => l.status === "pending" && l.requestedBy === "learner");
  console.log("\n=== LEARNER-INITIATED PENDING LINKS ===");
  console.log("Count:", learnerPending.length);
  for (const l of learnerPending) {
    console.log(`  id=${l.id} learnerName=${l.learnerName} — should show Accept/Reject`);
  }
}

main().catch(console.error);