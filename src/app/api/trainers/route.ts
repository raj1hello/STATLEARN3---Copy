import { requireSession } from "@/lib/auth/session";
import { usersCol, profilesCol } from "@/db/collections";
import { ok, handleError } from "@/lib/apiResponse";
import { toObjectId } from "@/lib/sanitize";

/**
 * Learner-facing trainer discovery. Finds users with the `trainer` role,
 * joins their profile, filters by name when `?q=` is given, and excludes the
 * requesting user themselves. Connection status (pending/accepted) is attached
 * so the /trainers page can render the right action per trainer.
 */
export async function GET(request: Request) {
  try {
    const session = await requireSession(request);

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    const [usersColHandle, profilesColHandle] = await Promise.all([usersCol(), profilesCol()]);

    const trainerUsers = await usersColHandle
      .find({ role: "trainer", _id: { $ne: toObjectId(session.userId) } })
      .toArray();

    if (trainerUsers.length === 0) {
      return ok({ trainers: [], total: 0 });
    }

    const trainerIds = trainerUsers.map((u) => u._id!);

    // Fetch profiles for all trainer users in one query
    const profiles = await profilesColHandle
      .find({ userId: { $in: trainerIds } })
      .toArray();

    const profileByUserId = new Map(profiles.map((p) => [p.userId.toString(), p]));

    // Load this learner's existing connections to mark status
    const { connectionsCol } = await import("@/db/collections");
    const connCol = await connectionsCol();
    const connections = await connCol
      .find({
        learnerId: toObjectId(session.userId),
        trainerId: { $in: trainerIds },
      })
      .toArray();
    const statusByTrainerId = new Map(
      connections.map((c) => [c.trainerId.toString(), c.status])
    );

    const trainers = trainerUsers
      .map((u) => {
        const idStr = u._id!.toString();
        const profile = profileByUserId.get(idStr);
        if (q && !profile?.name?.toLowerCase().includes(q)) return null;
        return {
          userId: idStr,
          name: profile?.name || u.email.split("@")[0] || "Trainer",
          designation: profile?.designation || undefined,
          department: profile?.department || undefined,
          stream: profile?.stream || undefined,
          experience: profile?.experience || undefined,
          existingSkills: profile?.existingSkills || [],
          connectionStatus: statusByTrainerId.get(idStr) || null,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    return ok({ trainers, total: trainers.length });
  } catch (error) {
    return handleError(error);
  }
}
