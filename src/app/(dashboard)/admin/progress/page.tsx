"use client";

import React, { useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminProgressPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await analyticsApi.getAdmin();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-64" /></div>;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>Progress & Activity</span>
          <Badge variant="blue" size="sm">Audit Log</Badge>
        </h1>
      </div>
      <Card className="p-8 text-center text-slate-500">
        System-wide progress and activity logs. Monitoring events from all organizations.
      </Card>
    </div>
  );
}
