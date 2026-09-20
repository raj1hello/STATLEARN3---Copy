"use client";

import React, { useEffect, useState } from "react";
import { organizationApi } from "@/lib/api/client";
import { GraduationCap, Search, Activity, Users, FileCheck2, Clock } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Trainer {
  id: string;
  email: string;
  name: string;
  designation: string | null;
  department: string | null;
  lastActive: string | null;
  status: string;
}

export default function TrainerStatusPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchTrainers() {
      try {
        const res = await organizationApi.listTrainers();
        if (res.success && res.data) {
          setTrainers(res.data.trainers);
        } else {
          setError(res.error?.message || "Failed to load trainers");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchTrainers();
  }, []);

  const filteredTrainers = trainers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = trainers.filter((t) => t.status === "active").length;
  const inactiveCount = trainers.length - activeCount;

  // Format a date safely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Trainer Status
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Monitor trainer activity and status across your organization.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161828] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total Trainers</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{loading ? "-" : trainers.length}</div>
        </div>

        <div className="bg-white dark:bg-[#161828] border border-emerald-200 dark:border-emerald-900/30 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Active</h3>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{loading ? "-" : activeCount}</div>
        </div>

        <div className="bg-white dark:bg-[#161828] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Inactive</h3>
          </div>
          <div className="text-3xl font-black text-slate-700 dark:text-slate-300">{loading ? "-" : inactiveCount}</div>
        </div>

        <div className="bg-white dark:bg-[#161828] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Recently Active</h3>
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {loading ? "-" : trainers.filter(t => t.lastActive != null).length}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-[#161828] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-[#10121d]/50">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="Search trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Loading trainers data...</p>
          </div>
        ) : error ? (
          <div className="p-10 flex flex-col items-center justify-center text-red-500 min-h-[300px]">
            <Activity className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium text-center">{error}</p>
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
            <GraduationCap className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No trainers registered in your organization yet.</p>
            {searchQuery && (
              <p className="text-xs mt-1">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-[#12141f] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Trainer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTrainers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200">{t.name}</p>
                          {t.designation && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.designation}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {t.email}
                    </td>
                    <td className="px-6 py-4">
                      {t.department ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.department}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic text-xs">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {t.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {formatDate(t.lastActive)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
