import { usersCol, profilesCol } from "@/db/collections";
import { requireSession } from "@/lib/auth/session";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    await requireSession(request); // any logged in user can search organizations

    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";

    if (!q || q.length < 2) {
      return ok({ organizations: [] });
    }

    const uCol = await usersCol();

    // Find all users with role 'organization'
    const orgUsers = await uCol.find({ role: "organization" }).toArray();

    if (orgUsers.length === 0) {
      return ok({ organizations: [] });
    }

    const orgIds = orgUsers.map(u => u._id!);

    const pCol = await profilesCol();

    // Search profiles of organizations matching the query (Name, Dept/College)
    const queryRegex = new RegExp(q, "i");
    const orgProfiles = await pCol.find({
      userId: { $in: orgIds },
      $or: [
        { name: queryRegex },
        { department: queryRegex },
        { designation: queryRegex }
      ]
    }).toArray();

    // Map safely, never exposing credentials
    const organizations = orgProfiles.map(p => {
      // Find the associated user email if needed, but not strictly required
      const user = orgUsers.find(u => u._id!.equals(p.userId));
      return {
        id: p.userId.toHexString(), // The Organization's user ID is what we use as organizationId
        name: p.name || "Unnamed Organization",
        department: p.department, // Could be the college/institution name
        designation: p.designation,
      };
    });

    return ok({ organizations });
  } catch (error) {
    return handleError(error);
  }
}
