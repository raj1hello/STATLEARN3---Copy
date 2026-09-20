import { RequireRoleGuard } from "@/components/auth/RequireRoleGuard";

/**
 * Server-side guard for the learner-facing /parent-links page.
 * Only the learner (to approve/decline requests addressed to their own
 * account) and admins may access it. Parents never see this page.
 */
export default function ParentLinksLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRoleGuard allowed={["learner", "admin"]}>{children}</RequireRoleGuard>
  );
}
