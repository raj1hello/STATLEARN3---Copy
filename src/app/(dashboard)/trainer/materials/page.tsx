"tsx"
"use client";

import React, { useState } from "react";
import { materialsApi } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UploadCloud, Sparkles, FileText, CheckCircle2, AlertCircle, ArrowRight, Send } from "lucide-react";
import Link from "next/link";
import { AssignContentModal } from "@/components/trainer/AssignContentModal";

export default function TrainerMaterialsPage() {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"text/plain" | "application/pdf">("text/plain");
  const [textContent, setTextContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedMaterial, setUploadedMaterial] = useState<any>(null);
  const [processedResult, setProcessedResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setUploading(true);
      const res = await materialsApi.upload({
        fileName,
        fileType,
        fileSize: new Blob([textContent]).size,
        textContent,
      });

      if (res.success && res.data) {
        setUploadedMaterial(res.data);
      } else {
        setError(res.error?.message || "Upload failed");
      }
    } catch {
      setError("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadedMaterial?._id) return;
    setError(null);
    try {
      setProcessing(true);
      const res = await materialsApi.process(uploadedMaterial._id);
      if (res.success && res.data) {
        setProcessedResult(res.data);
      } else {
        setError(res.error?.message || "Processing failed");
      }
    } catch {
      setError("An unexpected error occurred during processing");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Upload & Process Training Materials
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload PDF manuals or statistical curricula to automatically extract semantic chunks and topics
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Form */}
      <Card className="p-6 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">Document Payload</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">File Name</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">MIME Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500"
              >
                <option className="bg-white dark:bg-slate-800" value="text/plain">Text Document (.txt)</option>
                <option className="bg-white dark:bg-slate-800" value="application/pdf">PDF Manual (.pdf)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Material Text Content (Extracted Text)
            </label>
            <textarea
              rows={5}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full bg-white dark:bg-[#181a29] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600 dark:focus:border-purple-500 font-mono leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={uploading}
              className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-6 py-2.5 flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Uploaded Material & Trigger Process */}
      {uploadedMaterial && (
        <Card className="p-6 border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/30 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{uploadedMaterial.fileName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {uploadedMaterial._id}</p>
                <Badge variant="emerald" size="sm" className="mt-1">
                  Ready for AI Processing
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignModalOpen(true)}
                className="rounded-xl text-xs font-semibold px-4 py-2.5 flex items-center gap-2 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Assign Document</span>
              </Button>
              <Button
                onClick={handleProcess}
                loading={processing}
                className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold px-5 py-2.5 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Process with AI Analyzer</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Processed Results */}
      {processedResult && (
        <Card className="p-6 border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-[#11131f] shadow-md animate-fadeIn space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Content Analysis Complete</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Suggested Competency</span>
              <span className="font-bold text-purple-700 dark:text-purple-300 text-sm">{processedResult.suggestedCompetency}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block">Total Chunks Created</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{processedResult.totalChunks} Chunks</span>
            </div>
          </div>

          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/60">
            <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block mb-1">AI Executive Summary:</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{processedResult.summary}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignModalOpen(true)}
              className="rounded-xl text-xs font-semibold flex items-center gap-2 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Assign to Learner(s)</span>
            </Button>
            <Link href={`/trainer/quizzes?materialId=${processedResult.materialId}`}>
              <Button className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>Generate Quiz from this Material</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Assign Material Modal */}
      {uploadedMaterial && (
        <AssignContentModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          preselectedContent={{
            type: "material",
            refId: uploadedMaterial._id,
            title: uploadedMaterial.fileName,
          }}
        />
      )}
    </div>
  );
}
