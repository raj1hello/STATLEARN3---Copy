"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { streamsApi, streamTestsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import {
  BarChart3,
  LineChart,
  Cpu,
  Code2,
  BrainCircuit,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  Sparkles,
  Award,
} from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  LineChart,
  Cpu,
  Code2,
  BrainCircuit,
  FileSpreadsheet,
};

function StreamTestsContent() {
  const searchParams = useSearchParams();
  const querySearch = searchParams.get("search") || "";

  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>("all");
  const [search, setSearch] = useState(querySearch);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [streamsRes, testsRes] = await Promise.all([
          streamsApi.list(),
          streamTestsApi.list(),
        ]);
        if (streamsRes.success && streamsRes.data) setStreams(streamsRes.data);
        if (testsRes.success && testsRes.data) setTests(testsRes.data);
      } catch (err) {
        console.error("Failed to load stream tests", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (querySearch) {
      setSearch(querySearch);
    }
  }, [querySearch]);

  const filteredTests = tests.filter((test) => {
    const matchesStream = selectedStream === "all" || test.stream === selectedStream;
    const matchesDifficulty = difficultyFilter === "all" || test.difficulty === difficultyFilter;
    const matchesSearch =
      test.title.toLowerCase().includes(search.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(search.toLowerCase())) ||
      (test.stream && test.stream.toLowerCase().includes(search.toLowerCase()));

    return matchesStream && matchesDifficulty && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Stream-Based Assessments</span>
            <Badge variant="purple" size="sm">
              Adaptive CBT
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose your academic or professional stream to take targeted diagnostic tests & measure verified mastery
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy (Foundational)</option>
            <option value="medium">Medium (Applied)</option>
            <option value="hard">Hard (Advanced)</option>
          </select>
        </div>
      </div>

      {/* 1. STREAM SELECTOR GALLERY */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Select Academic / Professional Stream
          </h3>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
            {streams.length} Streams Available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* "All Streams" Tab */}
          <button
            type="button"
            onClick={() => setSelectedStream("all")}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedStream === "all"
                ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30"
                : "bg-white dark:bg-[#181a29] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-700"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">All Streams</p>
              <p className={`text-[10px] mt-0.5 ${selectedStream === "all" ? "text-purple-200" : "text-slate-400 dark:text-slate-500"}`}>
                {tests.length} tests
              </p>
            </div>
          </button>

          {/* Stream Cards */}
          {streams.map((s) => {
            const Icon = ICON_MAP[s.icon] || BarChart3;
            const isSelected = selectedStream === s.slug;

            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => setSelectedStream(s.slug)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30"
                    : "bg-white dark:bg-[#181a29] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-700"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight truncate">{s.title}</p>
                  <p className={`text-[10px] mt-0.5 ${isSelected ? "text-purple-200" : "text-slate-400 dark:text-slate-500"}`}>
                    {s.testCount || 1} available
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. STREAM TESTS CATALOG GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Available Stream Tests ({filteredTests.length})
          </h3>
          {selectedStream !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStream("all")}
              className="text-xs rounded-xl"
            >
              Reset Stream Filter
            </Button>
          )}
        </div>

        {filteredTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <Card
                key={test._id}
                className="p-6 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-800/80 transition-all border-slate-200 dark:border-slate-800/80 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="purple" size="sm" className="capitalize">
                      {test.stream?.replace("-", " ") || "General Stream"}
                    </Badge>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {test.durationMinutes || 25} Mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {test.description || "Comprehensive stream test evaluating core statistical and computational principles."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    Questions: <span className="font-bold text-slate-700 dark:text-slate-300">{test.questionCount || 5}</span>
                  </div>

                  <Link href={`/stream-tests/${test._id}`}>
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
            <BrainCircuit className="w-12 h-12 text-purple-400 dark:text-purple-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No tests found in this stream
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Try switching streams or selecting "All Streams" above to explore our full curriculum.
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStream("all");
                  setSearch("");
                }}
                className="text-xs rounded-xl"
              >
                Clear All Filters
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function StreamTestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading stream tests...</div>}>
      <StreamTestsContent />
    </Suspense>
  );
}
