"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user && pathname !== "/login" && pathname !== "/") {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0c14] flex items-center justify-center p-6 transition-colors duration-200">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 animate-pulse mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user && pathname !== "/login" && pathname !== "/") {
    return null;
  }

  const isAiTutor = pathname === "/ai-tutor";

  return (
    <div className={`bg-[#f8fafc] dark:bg-[#0b0c14] text-slate-900 dark:text-slate-100 flex transition-colors duration-200 ${
      isAiTutor ? "h-screen overflow-hidden" : "min-h-screen"
    }`}>
      {/* Deep Purple Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className={`flex-1 lg:pl-64 flex flex-col min-w-0 ${
        isAiTutor ? "h-screen overflow-hidden" : ""
      }`}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 max-w-7xl w-full mx-auto focus:outline-none ${
            isAiTutor
              ? "p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden"
              : "p-4 sm:p-6 lg:p-8 animate-fadeIn"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
