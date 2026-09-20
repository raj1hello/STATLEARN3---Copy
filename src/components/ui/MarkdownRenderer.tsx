"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
  return (
    <div
      className={`markdown-body break-words leading-relaxed text-sm ${
        isUser
          ? "text-white prose-invert"
          : "text-slate-800 dark:text-slate-200"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700/60 first:mt-0 text-slate-900 dark:text-slate-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mt-3 mb-2 pb-0.5 border-b border-slate-200/60 dark:border-slate-800 first:mt-0 text-slate-900 dark:text-slate-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mt-2.5 mb-1.5 first:mt-0 text-slate-900 dark:text-slate-100">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-2 mb-1 first:mt-0 text-slate-900 dark:text-slate-100">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-purple-950 dark:text-purple-300">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-2.5 pl-1 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2.5 pl-1 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500/60 pl-3 py-1 my-2 bg-purple-50/50 dark:bg-purple-950/30 rounded-r-lg text-slate-700 dark:text-slate-300 italic">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");
            if (isInline) {
              return (
                <code
                  className={`px-1.5 py-0.5 rounded text-[13px] font-mono ${
                    isUser
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-semibold"
                  }`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-slate-100 dark:bg-black/60 border border-slate-800">
                <code className="text-xs font-mono block leading-relaxed" {...props}>
                  {children}
                </code>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 p-2 font-semibold text-slate-900 dark:text-slate-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-100 dark:border-slate-800/40 p-2 text-slate-700 dark:text-slate-300">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-3 border-slate-200 dark:border-slate-800" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
