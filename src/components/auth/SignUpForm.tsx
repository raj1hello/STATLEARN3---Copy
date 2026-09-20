"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserRole } from "@/types";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Building2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ROLE_HOME: Record<UserRole, string> = {
  learner: "/dashboard",
  parent: "/parent",
  trainer: "/trainer",
  admin: "/admin",
  organization: "/organization",
};

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToLogin }: SignUpFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!selectedRole) {
      setError("Please select an account type");
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim(), password, name.trim(), selectedRole);
      if (!res.success) {
        setError(res.error || "Sign up failed. Please try again.");
      } else {
        if (onSuccess) {
          onSuccess();
        }
        router.push(ROLE_HOME[res.role || "learner"]);
      }
    } catch {
      setError("An unexpected error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: UserRole; label: string; icon: React.FC<any>; color: string }[] = [
    { value: "learner", label: "Learner", icon: User, color: "text-indigo-500" },
    { value: "parent", label: "Parent / Guardian", icon: Users, color: "text-purple-500" },
    { value: "trainer", label: "Trainer", icon: GraduationCap, color: "text-blue-500" },
    { value: "organization", label: "Organization", icon: Building2, color: "text-emerald-500" },
    { value: "admin", label: "Administrator", icon: ShieldCheck, color: "text-indigo-600" },
  ];

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-xs">Registration Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          required
          leftIcon={<User className="w-4 h-4" />}
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="priya@domain.com"
          required
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 chars"
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

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-hidden cursor-pointer"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />
        </div>

        {/* Account Type Selection */}
        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Account Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.value);
                    setError(null); // Clear error if they select once
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 px-1 rounded-xl border transition-all cursor-pointer text-center min-w-0 ${
                    isSelected
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-900/40 dark:border-purple-500 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161828] hover:border-purple-300 dark:hover:border-purple-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-purple-700 dark:text-purple-400" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className={`text-[11px] font-bold leading-tight ${
                    isSelected ? "text-purple-700 dark:text-purple-300" : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            loading={loading}
            className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-700/25 flex items-center justify-center gap-2"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Switch to Login Option */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
