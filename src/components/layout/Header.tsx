"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Search, Bell, Menu, User as UserIcon, Shield, GraduationCap, Building2, ChevronDown, Sun, Moon, History } from "lucide-react";
import { SearchHistoryDropdown } from "@/components/search/SearchHistoryDropdown";
import Link from "next/link";

export const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return {
          label: "Administrator",
          icon: Shield,
          bg: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60",
        };
      case "trainer":
        return {
          label: "Trainer",
          icon: GraduationCap,
          bg: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60",
        };
      case "organization":
        return {
          label: "Organization / College",
          icon: Building2,
          bg: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
        };
      default:
        return {
          label: "Statistical Officer / Learner",
          icon: UserIcon,
          bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="h-16 bg-white dark:bg-[#11131f] border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
      {/* Left: Mobile Menu Toggle + Global Search with History Dropdown */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl lg:hidden cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input with Search History */}
        <SearchHistoryDropdown />
      </div>

      {/* Right: Theme Toggle, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search History Quick Link */}
        <Link
          href="/search-history"
          className="p-2 text-slate-500 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors hidden sm:flex items-center"
          title="Search History"
        >
          <History className="w-5 h-5" />
        </Link>

        {/* Dark Mode / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          className="relative p-2 text-slate-500 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
          title={mounted && theme === "dark" ? "Switch to Light Theme" : "Switch to Dark/Black Theme"}
          aria-label="Toggle Theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-400 animate-fadeIn" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300 animate-fadeIn" />
          )}
        </button>

        {/* Notification Icon */}
        <button
          className="relative p-2 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full ring-2 ring-white dark:ring-[#11131f]" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center border border-purple-200 dark:border-purple-800/60">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {profile?.name || user?.email?.split("@")[0] || "User"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1">
                <RoleIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{profile?.designation || roleInfo.label}</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              onMouseLeave={() => setShowDropdown(false)}
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#161828] rounded-2xl shadow-dropdown border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fadeIn"
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.email}</p>
                <span className={`inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full border ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>
              <Link
                href="/profile"
                onClick={() => setShowDropdown(false)}
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                Profile & Privacy
              </Link>
              <Link
                href="/search-history"
                onClick={() => setShowDropdown(false)}
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                Search History
              </Link>
              {(user?.role === "organization" || user?.role === "admin") && (
                <Link
                  href="/organization"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                >
                  Organization Dashboard
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-medium"
                >
                  Admin Analytics
                </Link>
              )}
              {user?.role === "trainer" && (
                <Link
                  href="/trainer"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-sm text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-medium"
                >
                  Trainer Studio
                </Link>
              )}
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
