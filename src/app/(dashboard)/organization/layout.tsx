import { RequireRoleGuard } from "@/components/auth/RequireRoleGuard";

/**
 * Server-side guard for every /organization route.
 * Only organization and admin sessions may render organization analytics.
 */
export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRoleGuard allowed={["organization", "admin"]}>{children}</RequireRoleGuard>
  );
}
