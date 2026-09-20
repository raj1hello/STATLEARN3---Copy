"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

export type AttachmentCategory = "document" | "image" | "file";

export interface LocalAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  category: AttachmentCategory;
  dataUrl?: string; // image preview / data url
  extractedText?: string; // raw text (for documents)
  status: "pending" | "uploading" | "ready" | "error";
  error?: string;
}

interface AttachmentComposerProps {
  attachments: LocalAttachment[];
  onAdd: (att: LocalAttachment) => void;
  onRemove: (id: string) => void;
}

const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.txt,.md,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";
const FILE_ACCEPT = ".pdf,.doc,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.webp,.gif,.json,application/json";

const ACCEPTED_DOC_EXT = ["pdf", "doc", "docx", "txt", "md", "csv"];
const ACCEPTED_IMG_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
const ACCEPTED_FILE_EXT = ["pdf", "doc", "docx", "txt", "md", "csv", "jpg", "jpeg", "png", "webp", "gif", "json"];

function getExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function categorize(ext: string): AttachmentCategory {
  if (ACCEPTED_IMG_EXT.includes(ext)) return "image";
  if (ACCEPTED_DOC_EXT.includes(ext)) return "document";
  return "file";
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB mirror of env MAX_UPLOAD_SIZE_MB

export function AttachmentComposer({ attachments, onAdd, onRemove }: AttachmentComposerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function handleFiles(files: FileList | null, forcedCategory?: AttachmentCategory) {
    setError(null);
    if (!files || files.length === 0) return;
    setBusy(true);

    Array.from(files).forEach((file) => {
      const ext = getExt(file.name);
      const category = forcedCategory ?? categorize(ext);

      // Validate type
      const allowed = ACCEPTED_FILE_EXT.includes(ext);
      if (!allowed) {
        setError(`Unsupported file type: .${ext}. Supported: PDF, DOC, DOCX, TXT, MD, CSV, JPG, PNG, WEBP, GIF, JSON.`);
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        setError(`File "${file.name}" exceeds the 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const isImage = category === "image";
        const isTextLike = ["text/plain", "text/markdown", "text/csv", "application/json"].includes(file.type) || ["txt", "md", "csv", "json"].includes(ext);

        let decodedText: string | undefined = undefined;
        if (isTextLike && !isImage) {
          try {
            const b64 = result.split(",")[1];
            decodedText = b64 ? atob(b64) : result;
          } catch {
            decodedText = undefined;
          }
        }

        const att: LocalAttachment = {
          id: localId,
          name: file.name,
          type: file.type || (isImage ? "image/*" : "application/octet-stream"),
          size: file.size,
          category,
          dataUrl: isImage ? result : undefined,
          extractedText: decodedText,
          status: "ready",
        };
        onAdd(att);
      };
      reader.onerror = () => {
        setError(`Failed to read "${file.name}".`);
      };
      reader.readAsDataURL(file);
    });

    setBusy(false);
    setMenuOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* "+" Attachment Button */}
      <button
        type="button"
        aria-label="Add attachment"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181a29] text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          role="menu"
          className="absolute bottom-12 left-0 z-50 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#11131f] shadow-xl p-1.5 animate-in fade-in"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              docInputRef.current?.click();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer text-left"
          >
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Add document</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              imgInputRef.current?.click();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer text-left"
          >
            <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Add photo/image</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer text-left"
          >
            <FileIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Attach file</span>
          </button>
        </div>
      )}

      {busy && (
        <span className="absolute bottom-12 left-12 flex items-center gap-1 text-[10px] text-slate-400">
          <Loader2 className="w-3 h-3 animate-spin" /> reading...
        </span>
      )}

      {error && (
        <div className="absolute bottom-12 left-0 w-64 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[11px] text-red-600 dark:text-red-300 flex items-start gap-1.5 z-50">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={docInputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "document");
          e.target.value = "";
        }}
      />
      <input
        ref={imgInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function AttachmentChips({
  attachments,
  onRemove,
}: {
  attachments: LocalAttachment[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 pt-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="group relative flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-[#181a29]"
        >
          {att.category === "image" && att.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={att.dataUrl}
              alt={att.name}
              className="w-7 h-7 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : att.category === "image" ? (
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
          ) : att.category === "document" ? (
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center shrink-0">
              <FileIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
          )}
          <div className="min-w-0 max-w-[150px]">
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
              {att.name}
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-medium">
              {att.type.split("/").pop()?.replace("+", "") || "FILE"} · {(att.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${att.name}`}
            onClick={() => onRemove(att.id)}
            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
