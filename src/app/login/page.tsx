"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      if (user.role === "admin") router.push("/admin");
      else if (user.role === "trainer") router.push("/trainer");
      else if (user.role === "organization") router.push("/organization");
      else router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-lg w-full my-auto py-4">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black text-slate-900 tracking-wider">STATLEARN</span>
              <span className="block text-[11px] text-purple-700 font-bold uppercase tracking-widest -mt-1">
                Skill Intelligence
              </span>
            </div>
          </Link>
          <h2 className="text-xl font-bold text-slate-800 mt-6">Welcome back</h2>
          <p className="text-sm text-slate-600 mt-1">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-600 to-indigo-600" />
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          STATLEARN — Skill Intelligence Platform
        </p>
      </div>
    </div>
  );
}
