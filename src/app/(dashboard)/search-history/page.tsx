"use client";

import React, { useEffect, useState } from "react";
import { searchHistoryApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, Clock, Trash2, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SearchHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await searchHistoryApi.list();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to load search history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const res = await searchHistoryApi.delete(id);
      if (res.success) {
        setHistory((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete entry", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear your entire search history?")) return;
    try {
      setClearing(true);
      const res = await searchHistoryApi.clear();
      if (res.success) {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to clear search history", err);
    } finally {
      setClearing(false);
    }
  };

  const handleRunSearch = (query: string) => {
    router.push(`/stream-tests?search=${encodeURIComponent(query)}`);
  };

  const filtered = history.filter((item) =>
    item.query.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Student Search History</span>
            <Badge variant="purple" size="sm">
              {history.length} Saved
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Private log of your queries across competencies, stream tests, and course catalog
          </p>
        </div>

        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            loading={clearing}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </Button>
        )}
      </div>

      {/* Filter and Search within history */}
      {history.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter previous search queries..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
          />
        </div>
      )}

      {/* Search History List */}
      {filtered.length > 0 ? (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800/80 p-0 overflow-hidden border-slate-200 dark:border-slate-800/80">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.query}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRunSearch(item.query)}
                  className="text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <span>Search Again</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(item._id)}
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                  title="Delete query"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Clock className="w-12 h-12 text-purple-400 dark:text-purple-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {filter ? "No matching searches found" : "No search history recorded yet"}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {filter
              ? "Try adjusting your query filter."
              : "When you search for competencies, stream tests, or learning materials, your recent queries will appear here."}
          </p>
          <div className="mt-4">
            <Link href="/stream-tests">
              <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold">
                Explore Stream Tests
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
