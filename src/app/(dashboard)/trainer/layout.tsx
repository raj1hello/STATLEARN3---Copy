import { RequireRoleGuard } from "@/components/auth/RequireRoleGuard";

/**
 * Server-side guard for every /trainer route (Studio, My Learners,
 * Stream Test Authoring, Quizzes, Materials). Only trainer and admin
 * sessions may render trainer management functionality.
 */
export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRoleGuard allowed={["trainer", "admin"]}>{children}</RequireRoleGuard>
  );
}
