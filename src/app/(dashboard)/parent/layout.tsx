import { RequireRoleGuard } from "@/components/auth/RequireRoleGuard";
import { ParentReportProvider } from "@/components/parent/ParentReportProvider";

/**
 * Parent / Guardian Portal layout.
 *
 * Server-side guard (parent or admin only) runs BEFORE the report provider
 * renders, so a learner/trainer/organization session typing a /parent URL is
 * redirected at the server and never sees the portal. Admin may view the
 * portal for oversight (matches ParentReportProvider's own client check).
 */
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRoleGuard allowed={["parent", "admin"]}>
      <ParentReportProvider>{children}</ParentReportProvider>
    </RequireRoleGuard>
  );
}
