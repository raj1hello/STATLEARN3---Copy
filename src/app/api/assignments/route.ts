import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roleGuard";
import {
  createMultipleAssignments,
  listEnrichedAssignmentsForLearner,
  listEnrichedAssignmentsByTrainer,
} from "@/db/assignments";
import { hasAcceptedConnection } from "@/db/connections";
import { AssignmentStatus, AssignmentContentType } from "@/types";
import { ok, fail, handleError } from "@/lib/apiResponse";
import { isValidObjectId, sanitizeInput, toObjectId } from "@/lib/sanitize";

const CreateAssignmentSchema = z.object({
  learnerIds: z.array(z.string().min(1)).min(1, "At least one learner must be selected"),
  content: z.object({
    type: z.enum(["assessment", "quiz", "stream_test", "material", "note"]),
    refId: z.string().optional(),
    title: z.string().min(1, "Content title is required"),
    note: z
      .object({
        title: z.string().min(1, "Note title is required"),
        body: z.string().min(1, "Note content is required"),
      })
      .optional(),
  }),
  dueAt: z.string().datetime().optional(),
  message: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as AssignmentStatus | undefined;
    const learnerIdParam = url.searchParams.get("learnerId");

    if (session.role === "learner") {
      const assignments = await listEnrichedAssignmentsForLearner(session.userId, status);
      return ok({ assignments, total: assignments.length });
    }

    if (session.role === "trainer") {
      const assignments = await listEnrichedAssignmentsByTrainer(session.userId, learnerIdParam || undefined);
      return ok({ assignments, total: assignments.length });
    }

    if (session.role === "admin") {
      const trainerIdParam = url.searchParams.get("trainerId") || session.userId;
      const assignments = await listEnrichedAssignmentsByTrainer(trainerIdParam, learnerIdParam || undefined);
      return ok({ assignments, total: assignments.length });
    }

    return fail("FORBIDDEN", "Unauthorized role for assignments", 403);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    requireRole(session, ["trainer", "admin"]);

    const rawBody: unknown = await request.json().catch(() => ({}));
    const cleanBody = sanitizeInput(rawBody);
    const parsed = CreateAssignmentSchema.parse(cleanBody);

    // Validate content requirements
    if (parsed.content.type === "note") {
      if (!parsed.content.note?.title || !parsed.content.note?.body) {
        return fail("BAD_REQUEST", "Trainer note requires title and body content", 400);
      }
    } else {
      if (!parsed.content.refId || !isValidObjectId(parsed.content.refId)) {
        return fail("BAD_REQUEST", "Selected content reference ID is required and must be valid", 400);
      }
    }

    // Strict Security: Verify every target learner is valid and connected
    const validatedLearnerObjectIds = [];
    for (const lId of parsed.learnerIds) {
      if (!isValidObjectId(lId)) {
        return fail("INVALID_ID", `Invalid learner ID format: ${lId}`, 400);
      }

      if (session.role === "trainer") {
        const isConnected = await hasAcceptedConnection(session.userId, lId);
        if (!isConnected) {
          return fail(
            "FORBIDDEN",
            `Cannot assign content: You do not have an accepted connection with learner ${lId}`,
            403
          );
        }
      }

      validatedLearnerObjectIds.push(toObjectId(lId));
    }

    const created = await createMultipleAssignments({
      assignedBy: toObjectId(session.userId),
      learnerIds: validatedLearnerObjectIds,
      content: {
        type: parsed.content.type as AssignmentContentType,
        title: parsed.content.title,
        refId: parsed.content.refId ? toObjectId(parsed.content.refId) : undefined,
        note: parsed.content.note,
      },
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
      message: parsed.message,
    });

    return ok({
      message: `Successfully assigned to ${created.length} learner(s)`,
      count: created.length,
      assignments: created,
    });
  } catch (error) {
    return handleError(error);
  }
}
