"tsx"
"use client";

import React, { useEffect, useState } from "react";
import { coursesApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { Search, BookOpen, Star, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function IGOTCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await coursesApi.list();
        if (res.success && res.data) {
          setCourses((res.data as any).courses || []);
        }
      } catch (err) {
        console.error("Failed to load iGOT courses", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            iGOT Karmayogi Courses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Integrated National Learning Catalog Aligned with Statistical Competencies
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
          />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course, idx) => (
          <Card
            key={course._id || idx}
            className="p-6 flex flex-col justify-between hover:border-purple-200 dark:hover:border-purple-800/60 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="purple" size="sm">
                  iGOT Official
                </Badge>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>4.{7 - (idx % 3)}</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 rounded-2xl w-fit text-purple-700 dark:text-purple-300 mb-3">
                <BookOpen className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {course.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {course.description || "Comprehensive training module covering essential methodology, best practices, and practical analytical cases."}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 3-4 Weeks
              </span>

              <Link href="/learning-path">
                <Button
                  size="sm"
                  className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <span>Enroll in Path</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
