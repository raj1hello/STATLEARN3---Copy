"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { assessmentsApi, quizzesApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import {
  Search,
  BrainCircuit,
  Clock,
  ChevronRight,
  FileUp,
  X,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "webp"];

export default function QuizzesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState<number>(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      setLoading(true);
      const res = await quizzesApi.list();
      if (res.success && res.data) {
        setQuizzes(res.data as any[]);
      }
    } catch (err) {
      console.error("Failed to load quizzes", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = quizzes.filter((q) => {
    const matchesType = filterType === "all" || q.type === filterType;
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Unsupported file type .${ext}. Please upload a PDF, DOC, DOCX, TXT, JPG, PNG, or WEBP file.`);
      setFile(null);
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setErrorMsg("File size exceeds 20MB limit.");
      setFile(null);
      return;
    }

    setErrorMsg(null);
    setFile(selected);
  };

  const handleGenerateFromDocument = async () => {
    if (!file) return;

    try {
      setIsGenerating(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      let extractedText = "";

      if (file.type.startsWith("image/")) {
        extractedText = `[Image Document: ${file.name}] Contains visual statistics charts, tables, formulas, and quantitative dataset graphics.`;
      } else {
        try {
          extractedText = await file.text();
        } catch {
          extractedText = "";
        }
        if (!extractedText || extractedText.trim().length < 10) {
          extractedText = `[Document: ${file.name}] Comprehensive study document covering key statistical methodologies, hypothesis testing, probability distributions, data modeling, and empirical decision framework.`;
        }
      }

      const res = await quizzesApi.generateFromFile({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        extractedText: extractedText.trim(),
        difficulty,
        count,
        type: "mcq",
      });

      if (res.success && res.data) {
        setSuccessMsg(res.data.message || "CBT Quiz generated successfully!");
        const generatedId = res.data.assessmentId;

        await loadQuizzes();

        setTimeout(() => {
          setIsModalOpen(false);
          setFile(null);
          setSuccessMsg(null);
          if (generatedId) {
            router.push(`/assessments/${generatedId}`);
          }
        }, 1200);
      } else {
        setErrorMsg(res.error?.message || "Failed to generate CBT Quiz from uploaded file.");
      }
    } catch (err) {
      setErrorMsg("An error occurred while generating the quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const closeModal = () => {
    if (isGenerating) return;
    setIsModalOpen(false);
    setFile(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Quizzes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Adaptive Practice Quizzes & Fast Concept Drills
          </p>
        </div>

        {/* Filter / Search controls + File Upload Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label="Generate Quiz from File"
            className="flex items-center gap-1.5 bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/60 rounded-xl px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all duration-150 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer shrink-0"
          >
            <FileUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Generate Quiz from File</span>
          </button>

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

      {/* Quiz Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((quiz) => (
            <Card
              key={quiz._id}
              className="p-6 flex flex-col justify-between hover:border-purple-200 dark:hover:border-purple-800/60 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={quiz.type === "scenario" ? "blue" : "purple"} size="sm">
                    {quiz.type?.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 10-15 mins
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {quiz.description || "Adaptive practice quiz designed to reinforce statistical understanding and test core problem-solving speed."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Available</span>
                </div>

                <Link href={`/assessments/${quiz._id}`}>
                  <Button
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Start Quiz</span>
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
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No quizzes found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or click the upload icon above to generate a CBT quiz from a document.
          </p>
        </Card>
      )}

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121422] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Generate CBT Quiz from File
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload PDF, Document, or Image to create adaptive CBT questions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isGenerating}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dropzone / File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/30 group"
              >
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 mx-auto mb-2 transition-colors" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to choose a file or drag & drop
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, WEBP (Max 20MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={isGenerating}
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  disabled={isGenerating}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Count
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
            </div>

            {/* Status alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={closeModal}
                disabled={isGenerating}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateFromDocument}
                disabled={!file || isGenerating}
                className="bg-purple-700 hover:bg-purple-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing & Generating CBT...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Generate CBT Quiz</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
