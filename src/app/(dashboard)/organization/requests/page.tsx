"use client";

import React, { useEffect, useState } from "react";
import { organizationApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { FileCheck2, Check, X, Clock } from "lucide-react";
import { formatDate } from "@/components/parent/parentShared";

export default function OrganizationRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await organizationApi.getPendingRequests();
      if (res.success && res.data) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      setProcessing(id);
      const res = await organizationApi.processRequest(id, action);
      if (res.success) {
        setRequests(requests.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(`Failed to ${action} request`, err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="p-6">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Join Requests</span>
            <Badge variant="blue" size="sm">
              Pending Validation
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review and approve learners and trainers requesting to join your institution
          </p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3">Applicant Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No pending requests</p>
                      <p className="text-xs text-slate-400 mt-1">When learners or trainers request to join, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{req.userName}</div>
                      <div className="text-xs text-slate-500">{req.userEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={req.userRole === "trainer" ? "purple" : "blue"} size="sm" className="capitalize">
                        {req.userRole}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {req.createdAt ? formatDate(req.createdAt) : "Recently"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          loading={processing === req.id}
                          onClick={() => handleAction(req.id, "reject")}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          loading={processing === req.id}
                          onClick={() => handleAction(req.id, "approve")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
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
