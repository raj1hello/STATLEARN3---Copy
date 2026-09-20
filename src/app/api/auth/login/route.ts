import { z } from "zod";
import { MockAuthProvider } from "@/lib/auth/provider";
import { fail, handleError } from "@/lib/apiResponse";
import { NextResponse } from "next/server";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().optional(),
  role: z.enum(["learner", "trainer", "admin", "organization", "parent"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = LoginSchema.parse(body);

    const { session, cookie } = await MockAuthProvider.login({
      email: parsed.email,
      password: parsed.password,
      name: parsed.name,
      role: parsed.role,
    });

    const res = NextResponse.json({
      success: true,
      data: {
        userId: session.userId,
        email: session.email,
        role: session.role,
      },
    });

    // Set-Cookie header
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid credentials") {
      return fail("INVALID_CREDENTIALS", "Email or password is incorrect", 401);
    }
    return handleError(error);
  }
}
