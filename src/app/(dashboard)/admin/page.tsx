"use client";

import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { Building2, GraduationCap, Users, ShieldCheck, ArrowRight, FileCheck2, TrendingUp, Monitor } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/components/parent/parentShared";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await analyticsApi.getAdmin();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load admin analytics", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const overview = data?.organizationOverview || {};
  const perf = data?.assessmentPerformance || {};
  const organizations = data?.organizations || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Education Department Dashboard</span>
            <Badge variant="emerald" size="sm">
              <Monitor className="w-3 h-3 mr-1" /> Central Monitoring
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global oversight of institutions, trainers, and enrolled learners across the entire learning ecosystem.
          </p>
        </div>
      </div>

      {/* Primary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Organizations</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{overview.totalOrganizations}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{overview.activeOrganizations} active</span>
              </div>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Trainers</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{overview.totalTrainers}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{overview.activeTrainers} active</span>
              </div>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Learners</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{overview.totalLearners}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{overview.activeLearners} active</span>
              </div>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800/80">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Global Score</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{perf.averageAssessmentScore}%</span>
                <span className="text-[10px] text-slate-500 font-medium">({perf.totalAttemptsCompleted} attempts)</span>
              </div>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Organizations Table Card */}
      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Organizations Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Institutions registered in the ecosystem</p>
            </div>
          </div>
          <Link href="/admin/organizations">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer">
              View All <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3">Organization Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Trainers</th>
                <th className="px-5 py-3 text-right">Learners</th>
                <th className="px-5 py-3 text-right">Avg Score</th>
                <th className="px-5 py-3 text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No organizations registered yet.
                  </td>
                </tr>
              ) : (
                organizations.slice(0, 8).map((org: any) => (
                  <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                    <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium">
                      <Link href={`/admin/organizations/${org.id}`} className="hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">
                        {org.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={org.status === 'active' ? 'emerald' : 'slate'} size="sm" className="capitalize">
                        {org.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400">{org.totalTrainers || 0}</td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400">{org.totalLearners || 0}</td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400">
                      {org.averageScore ? `${org.averageScore}%` : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-500 text-xs">
                      {org.lastActive ? formatDate(org.lastActive) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
