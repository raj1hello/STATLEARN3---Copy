"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { parentApi } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Users, UserPlus } from "lucide-react";
import { LinkedLearnersModal } from "@/components/parent/LinkedLearnersModal";

/**
 * Shared data source for every Parent / Guardian Portal page.
 *
 * Fetches the server-authorised parent report for the selected linked learner.
 * The API route enforces role + link checks server-side; this provider is only
 * a thin client cache plus the learner switcher bar.
 */

export interface ParentReportData {
  parent: { id: string; name?: string };
  list: { learnerId: string; learnerName: string }[];
  report: any | null;
  noLinkedLearners?: boolean;
}

interface ParentReportContextValue {
  data: ParentReportData | null;
  loading: boolean;
  error: string | null;
  learnerId: string | null;
  setLearnerId: (learnerId: string) => void;
  refresh: () => Promise<void>;
  /** Opens the shared Link-Learner modal so any portal page can offer linking. */
  openLinkLearner: () => void;
}

const ParentReportContext = createContext<ParentReportContextValue | null>(null);

export const useParentReport = (): ParentReportContextValue => {
  const ctx = useContext(ParentReportContext);
  if (!ctx) {
    throw new Error("useParentReport must be used within a ParentReportProvider");
  }
  return ctx;
};

export const ParentReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<ParentReportData | null>(null);
  const [learnerId, setLearnerIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [linksOpen, setLinksOpen] = useState<boolean>(false);

  // Frontend UX guard only — the API enforces real authorization.
  useEffect(() => {
    if (user && user.role !== "parent" && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const load = useCallback(
    async (id: string | null) => {
      setLoading(true);
      setError(null);
      const res = await parentApi.getReport(id ?? undefined);
      if (res.success && res.data) {
        const payload = res.data;
        setData(payload);
        if (payload.report && payload.report.learner) {
          setLearnerIdState((prev) =>
            prev && payload.list.some((l) => l.learnerId === prev) ? prev : payload.report.learner.id
          );
        }
      } else {
        setError(res.error?.message || "Failed to load the learner report.");
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    load(null);
  }, [load]);

  const setLearnerId = useCallback(
    (id: string) => {
      setLearnerIdState(id);
      load(id);
    },
    [load]
  );

  const refresh = useCallback(() => load(learnerId), [load, learnerId]);

  const openLinkLearner = useCallback(() => setLinksOpen(true), []);

  return (
    <ParentReportContext.Provider value={{ data, loading, error, learnerId, setLearnerId, refresh, openLinkLearner }}>
      {user && (
        <div className="space-y-6">
          {/* Learner switcher + Link Learner bar, shared across all portal pages */}
          {!loading && data && (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {data.list.length > 1 && (
                <>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-500" />
                    Report for
                  </span>
                  <select
                    aria-label="Select learner"
                    value={learnerId ?? ""}
                    onChange={(e) => setLearnerId(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#11131f] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {data.list.map((l) => (
                      <option key={l.learnerId} value={l.learnerId}>
                        {l.learnerName}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <button
                type="button"
                onClick={() => setLinksOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Link Learner
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-72" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#11131f] rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="bg-white dark:bg-[#11131f] rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="bg-white dark:bg-[#11131f] rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="bg-white dark:bg-[#11131f] rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 space-y-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </Card>
          ) : (
            // Always render the page's own content. Pages show their own
            // "no linked learner" empty state (via openLinkLearner) so
            // navigation never depends on a learner being linked.
            children
          )}

          <LinkedLearnersModal
            isOpen={linksOpen}
            onClose={() => setLinksOpen(false)}
            onLinked={refresh}
          />
        </div>
      )}
    </ParentReportContext.Provider>
  );
};
