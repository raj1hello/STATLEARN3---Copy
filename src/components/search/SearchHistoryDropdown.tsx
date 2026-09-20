"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchHistoryApi } from "@/lib/api/client";
import { Search, Clock, Trash2, X, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchHistoryDropdownProps {
  onSelectSearch?: (query: string) => void;
}

export const SearchHistoryDropdown: React.FC<SearchHistoryDropdownProps> = ({ onSelectSearch }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleFocus = () => {
    setIsOpen(true);
    loadHistory();
  };

  const handleExecuteSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    try {
      await searchHistoryApi.record(trimmed);
    } catch {
      // Non-blocking
    }

    setIsOpen(false);
    if (onSelectSearch) {
      onSelectSearch(trimmed);
    } else {
      router.push(`/stream-tests?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExecuteSearch(query);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await searchHistoryApi.delete(id);
      if (res.success) {
        setHistory((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete search entry", err);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await searchHistoryApi.clear();
      if (res.success) {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to clear search history", err);
    }
  };

  const filteredHistory = history.filter((item) =>
    item.query.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative max-w-md w-full hidden sm:block">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search assessments, streams, skills..."
          className="w-full bg-slate-50 dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#1f2237] focus:border-purple-600 dark:focus:border-purple-500 focus:outline-none transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search History Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#161828] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fadeIn">
          <div className="px-3.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Recent Searches</span>
            </span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <div
                  key={item._id}
                  onClick={() => {
                    setQuery(item.query);
                    handleExecuteSearch(item.query);
                  }}
                  className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 shrink-0" />
                    <span className="truncate">{item.query}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(e, item._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md transition-all cursor-pointer"
                    title="Remove from history"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-3.5 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                {query ? "Press Enter to search for \"" + query + "\"" : "No recent searches. Type a topic to search."}
              </div>
            )}
          </div>

          <div className="px-3.5 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Tip: Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px]">Enter</kbd> to search
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/search-history");
              }}
              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Full History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
