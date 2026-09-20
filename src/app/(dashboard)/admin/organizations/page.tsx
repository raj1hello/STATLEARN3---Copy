"use client";

import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { Building2, Search } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/components/parent/parentShared";

export default function AdminOrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await analyticsApi.getAdmin();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load", err);
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
        <CardSkeleton />
      </div>
    );
  }

  const organizations = data?.organizations || [];

  const filtered = organizations.filter((o: any) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Organizations</span>
            <Badge variant="purple" size="sm">
              Ecosystem
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse and monitor all registered educational institutions.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No organizations found.
                  </td>
                </tr>
              ) : (
                filtered.map((org: any) => (
                  <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                    <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium">
                      <Link href={`/admin/organizations/${org.id}`} className="hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">
                        {org.name}
                      </Link>
                      <div className="text-[10px] text-slate-400 font-normal">{org.email}</div>
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
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">
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
