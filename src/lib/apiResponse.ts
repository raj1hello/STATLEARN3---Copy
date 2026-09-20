import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";
import { ApiResponse } from "@/types";

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse> {
  const errorBody: ApiResponse["error"] = { code, message };
  // Only include details in non-production to avoid leaking internals.
  if (details !== undefined && env.NODE_ENV !== "production") {
    errorBody.details = details;
  }
  return NextResponse.json({ success: false, error: errorBody }, { status });
}

/**
 * Centralized error handler for route handlers.
 * Maps known error shapes to controlled API responses and never leaks stack traces.
 */
export function handleError(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof ZodError) {
    return fail("VALIDATION_ERROR", "Invalid request", 400, error.flatten());
  }

  if (error instanceof Error) {
    // Map known custom messages
    if (error.message.startsWith("Invalid ObjectId") || error.message.startsWith("Invalid ID")) {
      return fail("INVALID_ID", "Invalid identifier provided", 400);
    }
    if (error.message === "UNAUTHORIZED") {
      return fail("UNAUTHORIZED", "Authentication required", 401);
    }
    if (error.message === "FORBIDDEN") {
      return fail("FORBIDDEN", "You do not have permission to perform this action", 403);
    }
    if (error.message === "NOT_FOUND") {
      return fail("NOT_FOUND", "Resource not found", 404);
    }
    if (error.message === "RATE_LIMITED") {
      return fail("RATE_LIMITED", "Too many requests, please try again later", 429);
    }

    // Log server-side (without secrets) but do not expose the message in production.
    console.error("[API_ERROR]", error.message);
    if (env.NODE_ENV !== "production") {
      return fail("INTERNAL_ERROR", error.message, 500);
    }
  } else {
    console.error("[API_ERROR] Unknown error");
  }

  return fail("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

// Custom error helpers to keep control flow clean in services/routes.
export const Errors = {
  unauthorized: () => new Error("UNAUTHORIZED"),
  forbidden: () => new Error("FORBIDDEN"),
  notFound: () => new Error("NOT_FOUND"),
  rateLimited: () => new Error("RATE_LIMITED"),
};
