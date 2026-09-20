"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  LayoutDashboard,
  Award,
  FileCheck2,
  BrainCircuit,
  GitFork,
  BookOpen,
  Bot,
  LineChart,
  User,
  Settings,
  LogOut,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  Layers,
  Building2,
  Mic,
  History,
  Users,
  UserCheck,
  FileText,
} from "lucide-react";

interface SubNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  // exact: true → only highlight on this exact pathname (ignores sub-paths).
  // exact: false (default) → also highlight on pathname.startsWith(href + "/"),
  // but ONLY if no other item in the same list is a more-specific match.
  exact?: boolean;
  roles?: ("learner" | "trainer" | "admin" | "organization")[];
  subItems?: SubNavItem[];
}

// ─── Single source-of-truth active-state helper ────────────────────────────
//
// Rules (in priority order):
//  1. Exact match always wins — if pathname === href, the item is active.
//  2. If the item is NOT marked exact, also match when pathname starts with
//     href + "/" (i.e. genuinely nested routes belong to this item).
//  3. An item is NEVER active if another item in the *same list* has a longer
//     href that also matches — prevents the parent route lighting up alongside
//     a more-specific sibling.  We achieve this by passing `siblings` so the
//     helper can detect the conflict.
//
// This function checks only the single item passed in; the caller must ensure
// it calls this for every item and that at most ONE returns true (guaranteed by
// the "more-specific sibling wins" rule encoded in the nav arrays + exact flags).

function isNavItemActive(pathname: string, href: string | undefined, exact = false): boolean {
  if (!href) return false;
  if (pathname === href) return true;
  if (exact) return false;
  // Prefix match — the pathname must start with href + "/" to be truly nested.
  return pathname.startsWith(href + "/");
}

// Variant for lists where we must also prevent a shorter sibling from lighting
// up when a longer sibling matches.  Pass the full list of hrefs in that section
// so we can check whether a more-specific entry is already an exact match.
function isNavItemActiveInList(
  pathname: string,
  href: string,
  exact: boolean,
  siblingHrefs: string[]
): boolean {
  if (!isNavItemActive(pathname, href, exact)) return false;
  // A sibling that is longer AND an exact match takes priority.
  const dominated = siblingHrefs.some(
    (s) => s !== href && s.length > href.length && pathname === s
  );
  return !dominated;
}

// ─── Learner nav ─────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Competencies", href: "/competencies", icon: Award },
  {
    label: "Practice",
    icon: FileCheck2,
    subItems: [
      { label: "Assessment", href: "/assessments", icon: FileCheck2 },
      { label: "Quiz", href: "/quizzes", icon: BrainCircuit },
      { label: "Stream Tests", href: "/stream-tests", icon: Layers },
    ],
  },
  { label: "Learning Path", href: "/learning-path", icon: GitFork },
  { label: "iGOT Courses", href: "/igot-courses", icon: BookOpen },
  { label: "AI Tutor", href: "/ai-tutor", icon: Bot },
  { label: "AI Mock Interview", href: "/mock-interview", icon: Mic },
  { label: "Trainers", href: "/trainers", icon: UserCheck },
  { label: "Search History", href: "/search-history", icon: History },
  { label: "Progress", href: "/progress", icon: LineChart },
  { label: "Profile", href: "/profile", icon: User },
];

// Trainer / Admin management section.
// /trainer is the root; /trainer/learners, /trainer/stream-tests, etc. are
// siblings of equal depth.  Mark /trainer as exact so it only lights up when
// the user is literally on the Trainer Studio root page.
const roleNavItems: NavItem[] = [
  {
    label: "Organization Portal",
    href: "/organization",
    icon: Building2,
    roles: ["organization"],
    exact: true,
  },
  {
    label: "Trainer Studio",
    href: "/trainer",
    icon: GraduationCap,
    roles: ["trainer"],
    exact: true,
  },
  {
    label: "My Learners",
    href: "/trainer/learners",
    icon: Users,
    roles: ["trainer"],
  },
  {
    label: "Stream Test Authoring",
    href: "/trainer/stream-tests",
    icon: Layers,
    roles: ["trainer"],
  },
];

// Organization Portal sidebar items.
// Only routes that actually exist under /organization are listed.
const orgNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/organization",
    icon: LayoutDashboard,
    exact: true,           // /organization/students must not light this up
  },
  {
    label: "Student Talent Directory",
    href: "/organization/students",
    icon: Users,
  },
  {
    label: "Trainer Status",
    href: "/organization/trainers",
    icon: GraduationCap,
  },
  {
    label: "Join Requests",
    href: "/organization/requests",
    icon: FileCheck2,
  },
];

// Admin / Education Department Portal navigation.
const adminNavItems: NavItem[] = [
  { label: "Dashboard",                 href: "/admin",               icon: LayoutDashboard, exact: true },
  { label: "Organizations",             href: "/admin/organizations", icon: Building2 },
  { label: "Trainers",                  href: "/admin/trainers",      icon: GraduationCap },
  { label: "Learners",                  href: "/admin/learners",      icon: Users },
  { label: "Assessments & Performance", href: "/admin/assessments",   icon: FileCheck2 },
  { label: "Competency Analytics",      href: "/admin/competencies",  icon: Award },
  { label: "Progress & Activity",       href: "/admin/progress",      icon: LineChart },
  { label: "Reports",                   href: "/admin/reports",       icon: FileText },
];

// Parents see ONLY this section; all other sections are hidden.
const parentNavItems: NavItem[] = [
  { label: "Overview",              href: "/parent",                icon: LayoutDashboard },
  { label: "Learner Report",        href: "/parent/learner-report", icon: FileCheck2 },
  { label: "Assessments & Quizzes", href: "/parent/assessments",    icon: BrainCircuit },
  { label: "Learning Progress",     href: "/parent/progress",       icon: LineChart },
  { label: "Competencies",          href: "/parent/competencies",   icon: Award },
  { label: "Stream Tests",          href: "/parent/stream-tests",   icon: Layers },
  { label: "Assigned Materials",    href: "/parent/materials",      icon: BookOpen },
  { label: "Activity & Performance",href: "/parent/history",        icon: History },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const Sidebar: React.FC<{ isOpen: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Keep Practice expanded if currently on an assessment, quiz, or stream-test route
  const isPracticeActive =
    pathname.startsWith("/assessments") ||
    pathname.startsWith("/quizzes") ||
    pathname.startsWith("/stream-tests");
  const [practiceOpen, setPracticeOpen] = useState<boolean>(isPracticeActive);

  useEffect(() => {
    if (isPracticeActive) {
      setPracticeOpen(true);
    }
  }, [isPracticeActive]);

  const currentRole = user?.role || "learner";

  // ── Parent active-state ──────────────────────────────────────────────────
  // The Overview href (/parent) is a prefix of every sibling, so we anchor it
  // to exact match only.  Every other item uses standard prefix matching.
  const parentSiblingHrefs = parentNavItems.map((i) => i.href!);
  const isParentItemActive = (item: NavItem): boolean => {
    if (!item.href) return false;
    const exact = item.href === "/parent"; // Overview root → exact only
    return isNavItemActiveInList(pathname, item.href, exact, parentSiblingHrefs);
  };

  // ── Org active-state ─────────────────────────────────────────────────────
  const orgSiblingHrefs = orgNavItems.map((i) => i.href!);
  const isOrgItemActive = (item: NavItem): boolean => {
    if (!item.href) return false;
    return isNavItemActiveInList(pathname, item.href, item.exact ?? false, orgSiblingHrefs);
  };

  // ── Admin active-state ───────────────────────────────────────────────────
  const adminSiblingHrefs = adminNavItems.map((i) => i.href!);
  const isAdminItemActive = (item: NavItem): boolean => {
    if (!item.href) return false;
    return isNavItemActiveInList(pathname, item.href, item.exact ?? false, adminSiblingHrefs);
  };

  // ── Generic role-nav active-state ────────────────────────────────────────
  const roleNavHrefs = roleNavItems.map((i) => i.href ?? "");
  const isRoleNavItemActive = (item: NavItem): boolean => {
    if (!item.href) return false;
    return isNavItemActiveInList(pathname, item.href, item.exact ?? false, roleNavHrefs);
  };

  // ── Learner main-nav active-state ────────────────────────────────────────
  // Sub-items are checked independently; the parent "Practice" button is not a
  // link so it needs no active state here.
  const mainNavHrefs = navItems.flatMap((i) =>
    i.href ? [i.href] : (i.subItems ?? []).map((s) => s.href)
  );
  const isMainNavItemActive = (href: string): boolean =>
    isNavItemActiveInList(pathname, href, false, mainNavHrefs);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#1e144a] dark:bg-[#0d0920] text-slate-200 flex flex-col transition-all duration-300 ease-in-out border-r border-indigo-950/50 dark:border-purple-950/40
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-indigo-900/40 dark:border-purple-900/30">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            <Image
              src="/statlearn-logo.png"
              alt="STATLEARN Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="font-bold text-white tracking-wider text-base">STATLEARN</div>
            <div className="text-[10px] text-purple-300 font-medium tracking-wide uppercase">AI Skill Intelligence</div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

          {/* ── PARENT ROLE ─────────────────────────────────────────────── */}
          {currentRole === "parent" ? (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-purple-300/60 uppercase tracking-wider">
                Parent / Guardian
              </div>
              <nav className="space-y-1">
                {parentNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isParentItemActive(item);
                  return (
                    <Link
                      key={item.label}
                      href={item.href || "#"}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                        ${active
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                          : "text-purple-200/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-purple-300/70"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

          /* ── ORGANIZATION ROLE ──────────────────────────────────────── */
          ) : currentRole === "organization" ? (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-purple-300/60 uppercase tracking-wider">
                Organization Portal
              </div>
              <nav className="space-y-1">
                {orgNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isOrgItemActive(item);
                  return (
                    <Link
                      key={item.label}
                      href={item.href || "#"}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                        ${active
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                          : "text-purple-200/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-purple-300/70"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

          /* ── ADMIN / EDUCATION DEPT ROLE ────────────────────────────── */
          ) : currentRole === "admin" ? (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-purple-300/60 uppercase tracking-wider">
                Education Department
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isAdminItemActive(item);
                  return (
                    <Link
                      key={item.label}
                      href={item.href || "#"}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                        ${active
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                          : "text-purple-200/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-purple-300/70"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

          /* ── LEARNER / TRAINER ROLES ────────────────────────────────── */
          ) : (
            <>
              {/* Main Learner Navigation */}
              <div>
                <div className="px-3 mb-2 text-[11px] font-semibold text-purple-300/60 uppercase tracking-wider">
                  Main Menu
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;

                    // Expandable Practice submenu
                    if (item.subItems) {
                      return (
                        <div key={item.label} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setPracticeOpen((prev) => !prev)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                              ${isPracticeActive
                                ? "bg-purple-600/30 text-white"
                                : "text-purple-200/70 hover:text-white hover:bg-white/5"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${isPracticeActive ? "text-purple-300" : "text-purple-300/70"}`} />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-purple-300/70 transition-transform duration-200 ${
                                practiceOpen ? "rotate-180 text-white" : ""
                              }`}
                            />
                          </button>

                          {practiceOpen && (
                            <div className="pl-6 space-y-1 pt-0.5">
                              {item.subItems.map((sub) => {
                                const SubIcon = sub.icon;
                                const active = isMainNavItemActive(sub.href);
                                return (
                                  <Link
                                    key={sub.label}
                                    href={sub.href}
                                    onClick={onClose}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150
                                      ${active
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                                        : "text-purple-200/60 hover:text-white hover:bg-white/5"
                                      }`}
                                  >
                                    <SubIcon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-purple-300/60"}`} />
                                    <span>{sub.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Regular top-level link
                    const active = item.href ? isMainNavItemActive(item.href) : false;
                    return (
                      <Link
                        key={item.label}
                        href={item.href || "#"}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                          ${active
                            ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                            : "text-purple-200/70 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-white" : "text-purple-300/70"}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Learner-only: parent link requests */}
                  {currentRole === "learner" && (
                    <Link
                      href="/parent-links"
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                        ${isMainNavItemActive("/parent-links")
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                          : "text-purple-200/70 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <UserCheck className={`w-4 h-4 ${isMainNavItemActive("/parent-links") ? "text-white" : "text-purple-300/70"}`} />
                      <span>Parent Connections</span>
                    </Link>
                  )}
                </nav>
              </div>

              {/* Role-specific management section (trainer) */}
              {(currentRole === "trainer") && (
                <div>
                  <div className="px-3 mb-2 text-[11px] font-semibold text-purple-300/60 uppercase tracking-wider">
                    Management
                  </div>
                  <nav className="space-y-1">
                    {roleNavItems
                      .filter((item) => !item.roles || item.roles.includes(currentRole))
                      .map((item) => {
                        const Icon = item.icon;
                        const active = isRoleNavItemActive(item);
                        return (
                          <Link
                            key={item.label}
                            href={item.href || "#"}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                              ${active
                                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                                : "text-purple-200/70 hover:text-white hover:bg-white/5"
                              }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? "text-white" : "text-purple-300/70"}`} />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                  </nav>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-indigo-900/40 dark:border-purple-900/30">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-purple-300/70 hover:text-white hover:bg-white/5 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-purple-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
