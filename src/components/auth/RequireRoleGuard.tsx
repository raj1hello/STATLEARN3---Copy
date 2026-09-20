import { getServerSession } from "@/lib/auth/serverSession";
import { redirect } from "next/navigation";

/**
 * Server-side role guard for route segments.
 *
 * Wraps a layout's children and enforces the allowed roles using the signed
 * session cookie (jwt.verify via getServerSession). This runs before any
 * client component renders, so an unauthorized user — including a parent
 * manually entering an admin/trainer/organization URL — is redirected
 * immediately and never sees the protected page or its data shell.
 *
 * Allowed roles are enforced here AND again server-side in every API route.
 */
export async function RequireRoleGuard({
  allowed,
  children,
}: {
  allowed: ("parent" | "learner" | "trainer" | "admin" | "organization")[];
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  if (!allowed.includes(session.role)) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
