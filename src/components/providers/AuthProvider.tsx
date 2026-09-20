"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api/client";
import { useRouter } from "next/navigation";

import { UserRole } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface ProfileData {
  _id?: string;
  userId: string;
  name: string;
  designation?: string;
  department?: string;
  experience?: number;
  education?: string;
  existingSkills: string[];
  careerGoal?: string;
  stream?: string;
  shareProfileWithOrganizations?: boolean;
  certifications?: string[];
  projects?: Array<{ title: string; description: string; skills?: string[] }>;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: ProfileData | null;
  loading: boolean;
  login: (
    email: string,
    pass: string,
    name?: string,
    role?: UserRole
  ) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshSession = async () => {
    try {
      const res = await authApi.getSession();
      if (res.success && res.data) {
        setUser({
          id: res.data.user.id,
          email: res.data.user.email,
          role: res.data.user.role as UserRole,
        });
        setProfile((res.data.profile as ProfileData) || null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, pass: string, name?: string, role?: UserRole) => {
    const res = await authApi.login(email, pass, name, role);
    if (res.success && res.data) {
      await refreshSession();
      return { success: true, role: res.data.role as UserRole };
    }
    return { success: false, error: res.error?.message || "Login failed" };
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setProfile(null);
    window.location.href = "/?login=true"; // Force a full page reload to completely clear React, Next.js, and fetch caches
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
