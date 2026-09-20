import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { organizationRequestsCol, usersCol, profilesCol } from "@/db/collections";
import { ok, fail, handleError, Errors } from "@/lib/apiResponse";
import { toObjectId } from "@/lib/sanitize";
import { OrganizationRequest } from "@/types";

const JoinRequestSchema = z.object({
  organizationId: z.string().min(1),
});

// Organization gets their pending requests
export async function GET(request: Request) {
  try {
    const session = await requireSession(request);

    // Only organization role can view pending requests for their org
    requireRole(session, ["organization"]);

    const reqCol = await organizationRequestsCol();
    const pCol = await profilesCol();

    // Find all 'pending' requests for this organization
    const requests = await reqCol.find({
      organizationId: toObjectId(session.userId),
      status: "pending"
    }).sort({ createdAt: -1 }).toArray();

    if (requests.length === 0) {
      return ok({ requests: [] });
    }

    // Populate user profiles for each request
    const userIds = requests.map(r => r.userId);
    const profiles = await pCol.find({ userId: { $in: userIds } }).toArray();

    const uCol = await usersCol();
    const users = await uCol.find({ _id: { $in: userIds } }).toArray();

    const enrichedRequests = requests.map(req => {
      const profile = profiles.find(p => p.userId.equals(req.userId));
      const user = users.find(u => u._id?.equals(req.userId));

      return {
        id: req._id?.toHexString(),
        userId: req.userId.toHexString(),
        userRole: req.userRole,
        userName: profile?.name || "Unknown User",
        userEmail: user?.email || "Unknown Email",
        status: req.status,
        createdAt: req.createdAt,
      };
    });

    return ok({ requests: enrichedRequests });
  } catch (error) {
    return handleError(error);
  }
}

// Learner/Trainer creates a join request
export async function POST(request: Request) {
  try {
    const session = await requireSession(request);

    // Only learners and trainers can request to join an organization
    requireRole(session, ["learner", "trainer"]);

    const rawBody = await request.json();
    const { organizationId } = JoinRequestSchema.parse(rawBody);

    const uCol = await usersCol();
    const orgUser = await uCol.findOne({
       _id: toObjectId(organizationId),
       role: "organization"
    });

    if (!orgUser) {
      throw Errors.notFound();
    }

    const reqCol = await organizationRequestsCol();

    // Check if user already has an active or pending request
    const existingReq = await reqCol.findOne({
      userId: toObjectId(session.userId),
      status: { $in: ["pending", "approved"] }
    });

    if (existingReq) {
      return fail("ALREADY_EXISTS", "You already have a pending or approved request", 400);
    }

    // Create the request
    const newReq: OrganizationRequest = {
      userId: toObjectId(session.userId),
      organizationId: toObjectId(organizationId),
      userRole: session.role,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await reqCol.insertOne(newReq);

    return ok({ message: "Join request sent successfully" });
  } catch (error) {
    return handleError(error);
  }
}
