import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { organizationRequestsCol, profilesCol } from "@/db/collections";
import { ok, handleError } from "@/lib/apiResponse";
import { toObjectId } from "@/lib/sanitize";

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);

    // Only learners and trainers have an 'organization' they belong to conceptually here
    requireRole(session, ["learner", "trainer"]);

    const reqCol = await organizationRequestsCol();

    // Check if user has an active or pending request
    const existingReq = await reqCol.findOne(
      { userId: toObjectId(session.userId) },
      { sort: { createdAt: -1 } } // Get most recent
    );

    let currentOrg = null;
    let requestStatus = "Not connected";

    if (existingReq) {
       requestStatus = existingReq.status; // pending, approved, rejected

       if (existingReq.status === "approved" || existingReq.status === "pending") {
           // fetch org details
           const pCol = await profilesCol();
           const orgProfile = await pCol.findOne({ userId: existingReq.organizationId });
           if (orgProfile) {
               currentOrg = {
                   id: existingReq.organizationId.toHexString(),
                   name: orgProfile.name || "Unknown Organization"
               };
           }
       }
    }

    return ok({
      status: requestStatus,
      organization: currentOrg
    });
  } catch (error) {
    return handleError(error);
  }
}
