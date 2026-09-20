"use client";

import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { Building2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate } from "@/components/parent/parentShared";

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
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
        console.error("Failed to load", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <CardSkeleton />
      </div>
    );
  }

  const organizations = data?.organizations || [];
  const org = organizations.find((o: any) => o.id === id);

  if (!org) {
    return (
      <div className="p-8 text-center text-slate-500">
        Organization not found.
        <br />
        <Link href="/admin/organizations" className="text-purple-600 hover:underline mt-4 inline-block">
          Return to Organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <Link href="/admin/organizations" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Organizations
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {org.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
              <span>{org.email}</span>
              <Badge variant={org.status === "active" ? "emerald" : "slate"} size="sm" className="capitalize">
                {org.status}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Trainers</p>
          <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">{org.totalTrainers || 0}</div>
        </Card>
        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Total Learners</p>
          <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">{org.totalLearners || 0}</div>
        </Card>
        <Card className="p-5 border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Average Score</p>
          <div className="text-2xl font-black mt-1 text-slate-900 dark:text-slate-100">{org.averageScore || 0}%</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Organization Profile (Read Only)</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">ID</span>
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{org.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Registered</span>
            <span className="text-slate-700 dark:text-slate-300">{org.lastActive ? formatDate(org.lastActive) : "Unknown"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
