import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import { listCompetencies, createCompetency } from "@/db/competencies";
import { getUserCompetencies } from "@/db/userCompetencies";
import { ok, handleError } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/sanitize";

const CreateCompetencySchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const catalogue = await listCompetencies();

    // If learner, enrich with their score and targets
    if (session.role === "learner") {
      const userScores = await getUserCompetencies(session.userId);
      const scoreMap = new Map(
        userScores.map((us) => [us.competencyId.toHexString(), us])
      );

      const enriched = catalogue.map((comp) => {
        const cid = comp._id?.toHexString() || "";
        const userComp = scoreMap.get(cid);
        return {
          ...comp,
          userScore: userComp
            ? {
                currentScore: userComp.currentScore,
                targetScore: userComp.targetScore,
                history: userComp.history,
              }
            : null,
        };
      });

      return ok(enriched);
    }

    return ok(catalogue);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);

    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = CreateCompetencySchema.parse(cleanBody);

    const created = await createCompetency(parsed);
    return ok(created, 201);
  } catch (error) {
    return handleError(error);
  }
}
