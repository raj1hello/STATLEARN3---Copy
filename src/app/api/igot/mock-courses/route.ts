import { requireSession } from "@/lib/auth/session";
import { listCourses } from "@/db/courses";
import { ok, handleError } from "@/lib/apiResponse";

export async function GET(request: Request) {
  try {
    // Authenticated users can list courses
    await requireSession(request);
    const { searchParams } = new URL(request.url);
    const competencyId = searchParams.get("competencyId") || undefined;

    const courses = await listCourses({
      source: "mock_igot",
      competencyId,
    });

    return ok({
      provider: "iGOT Karmayogi Mock Adapter",
      totalCourses: courses.length,
      courses,
    });
  } catch (error) {
    return handleError(error);
  }
}
