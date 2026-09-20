"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Building2,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToSignUp }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || "Invalid email or password");
      } else {
        if (onSuccess) {
          onSuccess();
        }
        if (res.role === "parent") {
          router.push("/parent");
        } else if (res.role === "admin") {
          router.push("/admin");
        } else if (res.role === "trainer") {
          router.push("/trainer");
        } else if (res.role === "organization") {
          router.push("/organization");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("An unexpected error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-xs">Authentication Failed</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <Input
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        <div className="pt-1">
          <Button
            type="submit"
            loading={loading}
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 dark:bg-purple-600 dark:hover:bg-purple-700 dark:active:bg-purple-800 text-white font-bold rounded-xl shadow-lg shadow-purple-700/30 flex items-center justify-center gap-2.5 transition-all"
          >
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Switch to Sign Up */}
      {onSwitchToSignUp && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>
      )}

      {/* Quick Demo Role Switcher */}
      <div className="mt-7 pt-5 border-t border-slate-200 dark:border-slate-800">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 text-center">
          Quick Demo — Sign in as
        </p>
        <div className="grid grid-cols-5 gap-2">
          {/* Parent */}
          <button
            type="button"
            onClick={() => handleQuickFill("parent@statlearn.local", "Parent@123")}
            className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all cursor-pointer min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/60 transition-colors">
              <Users className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors leading-tight text-center">
              Parent
            </span>
          </button>

          {/* Learner */}
          <button
            type="button"
            onClick={() => handleQuickFill("learner@statlearn.local", "Learner@123")}
            className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all cursor-pointer min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
              <User className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors leading-tight text-center">
              Learner
            </span>
          </button>

          {/* Trainer */}
          <button
            type="button"
            onClick={() => handleQuickFill("trainer@statlearn.local", "Trainer@123")}
            className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all cursor-pointer min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
              <GraduationCap className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors leading-tight text-center">
              Trainer
            </span>
          </button>

          {/* Admin */}
          <button
            type="button"
            onClick={() => handleQuickFill("admin@statlearn.local", "Admin@123")}
            className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all cursor-pointer min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/60 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors leading-tight text-center">
              Admin
            </span>
          </button>

          {/* Organization */}
          <button
            type="button"
            onClick={() => handleQuickFill("organization@statlearn.local", "Org@123")}
            className="group flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all cursor-pointer min-w-0"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-tight text-center">
              Organization
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}