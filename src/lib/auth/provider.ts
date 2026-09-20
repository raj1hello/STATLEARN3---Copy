import { env } from "@/lib/env";
import { SessionPayload, UserRole } from "@/types";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const { sign, verify } = jwt;

/**
 * Mock authentication provider that stores sessions in an HttpOnly signed cookie.
 * In a real implementation this would verify credentials against a user store.
 */
export class MockAuthProvider {
  /**
   * Retrieve the current session from request cookies.
   */
  static async getSession(request: Request): Promise<SessionPayload | null> {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, v] = c.split("=");
        return [k, v];
      })
    );
    const token = cookies["session"];
    if (!token) return null;
    try {
      const payload = verify(token, env.SESSION_SECRET) as SessionPayload;
      return payload;
    } catch (e) {
      // Invalid token
      return null;
    }
  }

  /**
   * Login with email and password (mock). Returns a signed session cookie.
   */
  static async login(params: {
    email: string;
    password: string; // plain text, will be checked against stored hash (mock)
    name?: string;
    role?: UserRole;
  }): Promise<{ session: SessionPayload; cookie: string }> {
    // In a real system we would look up the user; here we mock a user for demo.
    const user = await import("@/db/users").then((mod) => mod.findUserByEmail(params.email));
    const found = await user; // user is a Promise<User | null>
    if (!found) {
      // Create user for the sake of demo/registration.
      const passwordHash = createHash("sha256").update(params.password).digest("hex");
      let assignedRole: UserRole = params.role || "learner";

      // If no explicit role was passed (fallback for direct API hitting), infer it occasionally
      if (!params.role) {
        const lowerEmail = params.email.toLowerCase();
        if (lowerEmail.startsWith("admin")) assignedRole = "admin";
        else if (lowerEmail.startsWith("trainer")) assignedRole = "trainer";
        else if (lowerEmail.startsWith("parent")) assignedRole = "parent";
        else if (lowerEmail.startsWith("org") || lowerEmail.includes("college") || lowerEmail.includes("university") || lowerEmail.includes("organization")) assignedRole = "organization";
      }

      const newUser = await import("@/db/users").then((mod) =>
        mod.createUser({ email: params.email, role: assignedRole, passwordHash })
      );

      const { ObjectId } = await import("mongodb");
      // Create initial profile for new user
      await import("@/db/profiles").then((mod) =>
        mod.upsertProfile(newUser._id!, {
          name: params.name || params.email.split("@")[0],
          existingSkills: [],
          shareProfileWithOrganizations: assignedRole === "learner" ? false : undefined,
        })
      );
      const payload: SessionPayload = {
        userId: newUser._id!.toHexString(),
        email: newUser.email,
        role: newUser.role,
      };
      const token = sign(payload, env.SESSION_SECRET, { expiresIn: "7d" });
      const cookie = MockAuthProvider.buildCookie(token);
      return { session: payload, cookie };
    }

    // Verify the password (hash compare) – mock simple compare.
    const expectedHash = found.passwordHash ?? "";
    const providedHash = createHash("sha256").update(params.password).digest("hex");
    if (expectedHash !== providedHash) {
      throw new Error("Invalid credentials");
    }
    const payload: SessionPayload = {
      userId: found._id!.toHexString(),
      email: found.email,
      role: found.role,
    };
    const token = sign(payload, env.SESSION_SECRET, { expiresIn: "7d" });
    const cookie = MockAuthProvider.buildCookie(token);
    return { session: payload, cookie };
  }

  /**
   * Logout – clears the session cookie.
   */
  static async logout(): Promise<string> {
    // Set cookie expiration to past date.
    return MockAuthProvider.buildCookie("", { expires: new Date(0) });
  }

  private static buildCookie(token: string, options?: { expires?: Date }) {
    const cookieParts = [
      `session=${token}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=Lax`,
    ];
    if (env.NODE_ENV === "production") cookieParts.push(`Secure`);
    const expires = options?.expires ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    cookieParts.push(`Expires=${expires.toUTCString()}`);
    return cookieParts.join("; ");
  }
}
