import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";

export async function GET() {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return NextResponse.json({
      success: true,
      data: {
        status: "ok",
        mongodb: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "HEALTH_CHECK_FAILED", message: "Database connection failed" },
      },
      { status: 500 }
    );
  }
}
