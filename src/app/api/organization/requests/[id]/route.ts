import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { organizationRequestsCol, profilesCol } from "@/db/collections";
import { ok, handleError, Errors } from "@/lib/apiResponse";
import { toObjectId } from "@/lib/sanitize";

const UpdateRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession(request);
    requireRole(session, ["organization"]);

    const rawBody = await request.json();
    const { action } = UpdateRequestSchema.parse(rawBody);

    const reqCol = await organizationRequestsCol();

    // Find the request, ensure it belongs to this organization
    const orgReq = await reqCol.findOne({
      _id: toObjectId(id),
      organizationId: toObjectId(session.userId),
      status: "pending"
    });

    if (!orgReq) {
      throw Errors.notFound();
    }

    // Update the request status
    const newStatus = action === "approve" ? "approved" : "rejected";
    await reqCol.updateOne(
      { _id: orgReq._id },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    // If approved, update the user profile with the organizationId
    if (newStatus === "approved") {
      const pCol = await profilesCol();

      // Update the user's profile to formally associate them with this organization
      await pCol.updateOne(
        { userId: orgReq.userId },
        {
          $set: {
            organizationId: orgReq.organizationId
          }
        }
      );
    }

    return ok({ message: `Request successfully ${newStatus}` });
  } catch (error) {
    return handleError(error);
  }
}
