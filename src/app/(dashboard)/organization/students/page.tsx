"use client";

import React, { useEffect, useState, Suspense } from "react";
import { organizationApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import {
  Users,
  Search,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FolderGit2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import Link from "next/link";

function OrganizationStudentsContent() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [streamFilter, setStreamFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [streamFilter, skillFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await organizationApi.listStudents({
        stream: streamFilter !== "all" ? streamFilter : undefined,
        skill: skillFilter || undefined,
      });
      if (res.success && res.data) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error("Failed to load consenting student profiles", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectStudent = async (studentId: string) => {
    try {
      setSelectedStudentId(studentId);
      setDetailsLoading(true);
      const res = await organizationApi.getStudent(studentId);
      if (res.success && res.data) {
        setStudentDetails(res.data);
      }
    } catch (err) {
      console.error("Failed to inspect student details", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase()) ||
      s.verifiedSkills?.some((sk: string) => sk.toLowerCase().includes(search.toLowerCase())) ||
      s.careerGoal?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Verified Student Talent Directory</span>
            <Badge variant="emerald" size="sm">
              Consented Profiles
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Discover verified student talent across statistical methodologies, machine learning, and quantitative analytics
          </p>
        </div>

        <Link href="/organization">
          <Button variant="outline" size="sm" className="text-xs rounded-xl">
            ← Back to College Dashboard
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#11131f] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, skills, or career focus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="bg-slate-50 dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="all">All Streams</option>
            <option value="statistics">Statistics & Probability</option>
            <option value="data-analytics">Data Analytics & BI</option>
            <option value="computer-science">Computer Science</option>
            <option value="programming">Programming (Python/R/SQL)</option>
            <option value="machine-learning">Machine Learning & AI</option>
            <option value="economics-surveys">Economics & Surveys</option>
          </select>
        </div>
      </div>

      {/* Talent Cards Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((st) => (
            <Card
              key={st.id}
              className="p-6 border-slate-200 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-lg flex items-center justify-center border border-purple-200 dark:border-purple-800/60 shrink-0">
                      {st.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {st.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{st.designation}</p>
                    </div>
                  </div>

                  <Badge variant="emerald" size="sm" className="shrink-0">
                    {st.verifiedCompetencyScore}% Verified
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 mb-4">
                  <p className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{st.education}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span className="capitalize">Stream: {st.stream?.replace("-", " ") || "Statistics"}</span>
                  </p>
                </div>

                {/* Verified Skills Tags */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Verified Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {st.verifiedSkills.slice(0, 4).map((sk: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/50 text-[11px] font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                    {st.verifiedSkills.length > 4 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{st.verifiedSkills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {st.totalAssessmentsCompleted} tests completed
                </span>
                <Button
                  size="sm"
                  onClick={() => handleInspectStudent(st.id)}
                  className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View Verified Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No consenting student profiles matched
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Only students who have opted-in to industry collaboration are displayed here.
          </p>
        </Card>
      )}

      {/* DETAILED STUDENT INSPECTION MODAL */}
      <Modal
        isOpen={Boolean(selectedStudentId)}
        onClose={() => {
          setSelectedStudentId(null);
          setStudentDetails(null);
        }}
      >
        {detailsLoading || !studentDetails ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Modal Student Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-black text-xl flex items-center justify-center border border-purple-200 dark:border-purple-800/60">
                  {studentDetails.student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {studentDetails.student.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {studentDetails.student.designation} • {studentDetails.student.department}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="emerald" size="sm">
                      Verified Talent
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      Stream: {studentDetails.student.stream || "Statistics"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic & Goal Overview */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-[#181a29] rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-semibold block">Education & Degree</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold mt-0.5 block">
                  {studentDetails.student.education || "Bachelor's Degree"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#181a29] rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-semibold block">Career Focus</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold mt-0.5 block">
                  {studentDetails.student.careerGoal || "Quantitative Research"}
                </span>
              </div>
            </div>

            {/* Verified Competencies */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Verified Competency Mastery
              </h4>
              <div className="space-y-2">
                {studentDetails.verifiedCompetencies?.map((comp: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#181a29] border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{comp.competencyName}</span>
                    <span className="font-bold text-purple-700 dark:text-purple-400">{comp.currentScore}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects & Certifications */}
            {studentDetails.student.projects?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Featured Projects
                </h4>
                <div className="space-y-2">
                  {studentDetails.student.projects.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 text-xs"
                    >
                      <h5 className="font-bold text-slate-900 dark:text-slate-100">{p.title}</h5>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function OrganizationStudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading student directory...</div>}>
      <OrganizationStudentsContent />
    </Suspense>
  );
}
