import { RequireRoleGuard } from "@/components/auth/RequireRoleGuard";

/**
 * Server-side guard for every /admin route.
 * Only admin sessions may render the Admin Dashboard / workforce analytics.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRoleGuard allowed={["admin"]}>{children}</RequireRoleGuard>
  );
}
