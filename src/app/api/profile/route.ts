import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getProfileByUserId, upsertProfile } from "@/db/profiles";
import { ok, handleError } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/sanitize";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  experience: z.number().nonnegative().optional(),
  education: z.string().max(100).optional(),
  existingSkills: z.array(z.string().max(50)).optional(),
  careerGoal: z.string().max(300).optional(),
  stream: z.string().max(100).optional(),
  shareProfileWithOrganizations: z.boolean().optional(),
  certifications: z.array(z.string().max(100)).optional(),
  projects: z.array(
    z.object({
      title: z.string().max(150),
      description: z.string().max(1000),
      skills: z.array(z.string()).optional(),
    })
  ).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const profile = await getProfileByUserId(session.userId);
    return ok(profile || { userId: session.userId, name: "", existingSkills: [] });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    const rawBody: unknown = await request.json();
    const cleanBody = sanitizeInput(rawBody);
    const parsed = UpdateProfileSchema.parse(cleanBody);

    const updated = await upsertProfile(session.userId, parsed);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
