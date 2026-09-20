import { getServerSession, ROLE_HOME } from "@/lib/auth/serverSession";
import { redirect } from "next/navigation";

/**
 * Role-aware dispatch for the generic /dashboard URL.
 *
 * /dashboard (the default landing after login) renders the LEARNER dashboard
 * only for learner sessions. Every other role is redirected server-side to
 * their own workspace before any client component renders:
 *
 *   parent       -> /parent        (Parent / Guardian Portal)
 *   trainer      -> /trainer       (Trainer Studio)
 *   admin        -> /admin         (Admin Dashboard)
 *   organization -> /organization  (Organization Dashboard)
 *
 * Stops a parent (or any role) from ever rendering the learner dashboard —
 * and stops elevated roles from being stranded on the wrong home page.
 */
export default async function LearnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "learner") {
    redirect(ROLE_HOME[session.role] ?? "/dashboard");
  }
  return <>{children}</>;
}
