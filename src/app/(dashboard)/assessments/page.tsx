"tsx"
"use client";

import React, { useEffect, useState } from "react";
import { assessmentsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { Search, FileCheck2, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function AssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await assessmentsApi.list();
        if (res.success && res.data) {
          setAssessments(res.data as any[]);
        }
      } catch (err) {
        console.error("Failed to load assessments", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = assessments.filter((a) => {
    const matchesType = filterType === "all" || a.type === filterType;
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Assessments</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Statistical Competency Evaluations & Diagnostic Tests
          </p>
        </div>

        {/* Filter / Search controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="mcq">Multiple Choice (MCQ)</option>
            <option value="scenario">Scenario-Based</option>
          </select>
        </div>
      </div>

      {/* Assessment Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((assessment) => (
            <Card
              key={assessment._id}
              className="p-6 flex flex-col justify-between hover:border-purple-200 dark:hover:border-purple-800/60 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={assessment.type === "scenario" ? "blue" : "purple"} size="sm">
                    {assessment.type?.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 20-30 mins
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {assessment.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {assessment.description || "Official competency diagnostic designed to evaluate core principles and applied analytical accuracy."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Available</span>
                </div>

                <Link href={`/assessments/${assessment._id}`}>
                  <Button
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Start Test</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <FileCheck2 className="w-12 h-12 text-purple-400 dark:text-purple-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No assessments found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter options.
          </p>
        </Card>
      )}
    </div>
  );
}
