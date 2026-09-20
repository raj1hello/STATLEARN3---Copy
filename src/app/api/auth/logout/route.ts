import { MockAuthProvider } from "@/lib/auth/provider";
import { NextResponse } from "next/server";

export async function POST() {
  const cookie = await MockAuthProvider.logout();
  const res = NextResponse.json({
    success: true,
    data: { message: "Logged out successfully" },
  });
  res.headers.set("Set-Cookie", cookie);
  return res;
}
