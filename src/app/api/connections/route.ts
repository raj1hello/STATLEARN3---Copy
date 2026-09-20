import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import {
  createConnectionRequest,
  getConnectionByPair,
  listEnrichedIncomingConnections,
  listEnrichedOutgoingConnections,
} from "@/db/connections";
import { findUserById } from "@/db/users";
import { getProfileByUserId } from "@/db/profiles";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput, toObjectId } from "@/lib/sanitize";

const CreateConnectionSchema = z.object({
  trainerId: z.string().min(1, "Trainer ID is required"),
  requestMessage: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as "pending" | "accepted" | "rejected" | undefined;

    if (session.role === "trainer") {
      const connections = await listEnrichedIncomingConnections(session.userId, status);
      return ok({ connections, total: connections.length });
    }

    if (session.role === "learner") {
      const connections = await listEnrichedOutgoingConnections(session.userId, status);
      return ok({ connections, total: connections.length });
    }

    if (session.role === "admin") {
      const trainerId = url.searchParams.get("trainerId");
      const learnerId = url.searchParams.get("learnerId");
      if (trainerId) {
        const connections = await listEnrichedIncomingConnections(trainerId, status);
        return ok({ connections, total: connections.length });
      }
      if (learnerId) {
        const connections = await listEnrichedOutgoingConnections(learnerId, status);
        return ok({ connections, total: connections.length });
      }
      // Default to incoming if trainerId or outgoing if learnerId
      const connections = await listEnrichedIncomingConnections(session.userId, status);
      return ok({ connections, total: connections.length });
    }

    return fail("FORBIDDEN", "Unauthorized role for connections", 403);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["learner", "admin"]);

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = CreateConnectionSchema.parse(cleanBody);

    if (!isValidObjectId(parsed.trainerId)) {
      return fail("INVALID_ID", "Invalid trainer ID format", 400);
    }

    if (parsed.trainerId === session.userId) {
      return fail("INVALID_REQUEST", "You cannot send a connection request to yourself", 400);
    }

    // Verify target user is a trainer
    const trainerUser = await findUserById(parsed.trainerId);
    if (!trainerUser || (trainerUser.role !== "trainer" && trainerUser.role !== "admin")) {
      return fail("NOT_FOUND", "Trainer not found", 404);
    }

    // Check existing connection
    const existing = await getConnectionByPair(parsed.trainerId, session.userId);
    if (existing) {
      if (existing.status === "pending") {
        return fail("ALREADY_EXISTS", "A connection request is already pending with this trainer", 409);
      }
      if (existing.status === "accepted") {
        return fail("ALREADY_CONNECTED", "You are already connected with this trainer", 409);
      }
      // If rejected, allow re-requesting by updating status to pending
      const { connectionsCol } = await import("@/db/collections");
      const col = await connectionsCol();
      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: "pending",
            requestMessage: parsed.requestMessage || "",
            createdAt: new Date(),
            respondedAt: undefined,
          },
        }
      );
      return ok({ message: "Connection request sent successfully", connectionId: existing._id });
    }

    // Get learner name from profile for display
    const learnerProfile = await getProfileByUserId(session.userId);
    const senderName = learnerProfile?.name || session.email.split("@")[0] || "Learner";

    const connection = await createConnectionRequest({
      trainerId: toObjectId(parsed.trainerId),
      learnerId: toObjectId(session.userId),
      requestMessage: parsed.requestMessage,
      senderName,
    });

    return ok({ message: "Connection request sent successfully", connection });
  } catch (error) {
    return handleError(error);
  }
}
