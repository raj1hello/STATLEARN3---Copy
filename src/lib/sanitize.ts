import { ObjectId } from "mongodb";

/**
 * Recursively sanitizes objects to prevent NoSQL injection by removing keys
 * that start with '$' or contain '.' (except when handling valid structures,
 * but even then, query selectors from client input must be rigorously filtered).
 */
export function sanitizeInput<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (input instanceof ObjectId) {
    return input;
  }

  if (input instanceof Date) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      // Reject any keys starting with $ or containing .
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized as T;
  }

  return input;
}

/**
 * Helper to validate and convert a string or ObjectId into a MongoDB ObjectId.
 * Throws an error if invalid.
 */
export function toObjectId(id: string | ObjectId | undefined | null): ObjectId {
  if (!id) {
    throw new Error("Invalid ID: ID is required");
  }
  if (id instanceof ObjectId) {
    return id;
  }
  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error(`Invalid ObjectId format: "${id}"`);
}

/**
 * Safely check if a string is a valid ObjectId without throwing.
 */
export function isValidObjectId(id: unknown): boolean {
  if (!id) return false;
  if (id instanceof ObjectId) return true;
  return typeof id === "string" && ObjectId.isValid(id);
}
