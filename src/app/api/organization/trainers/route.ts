import { NextResponse } from "next/server";
import { usersCol, profilesCol } from "@/db/collections";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { handleError, ok } from "@/lib/apiResponse";
import { ObjectId } from "mongodb";

/**
 * GET - List trainers belonging strictly to the authenticated organization.
 */
export async function GET(request: Request) {
  try {
    const session = await requireSession(request);

    // Explicitly enforce that ONLY organization can access this specific endpoint
    requireRole(session, ["organization"]);

    const pCol = await profilesCol();
    const uCol = await usersCol();

    // From Profile schema: organizationId represents the assigned organization
    // An organization authenticated user's ID is the organizationId
    const organizationId = session.userId; // string

    // 1. Find profiles belonging to this organization
    const orgTrainerProfiles = await pCol.find({
      organizationId: new ObjectId(organizationId)
    }).toArray();

    if (orgTrainerProfiles.length === 0) {
      return ok({ trainers: [], total: 0 });
    }

    const tIds = orgTrainerProfiles.map(p => p.userId);

    // 2. Find the corresponding users providing they have trainer role
    const trainers = await uCol.find({
      _id: { $in: tIds },
      role: "trainer"
    }).toArray();

    if (trainers.length === 0) {
      return ok({ trainers: [], total: 0 });
    }

    // Map them together securely (enforcing tenant isolation)
    const trainerData = trainers.map((t) => {
      const p = orgTrainerProfiles.find((pr: any) => pr.userId.toHexString() === t._id!.toHexString());
      return {
        id: t._id!.toHexString(),
        email: t.email,
        name: p?.name || "Unknown Trainer",
        designation: p?.designation || null,
        department: p?.department || null,
        lastActive: null,
        status: "active",
      };
    });

    return ok({
      trainers: trainerData,
      total: trainerData.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
