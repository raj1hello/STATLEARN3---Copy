"use client";

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</label>}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500 dark:text-purple-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-xl py-3 px-4 text-sm font-medium transition-all
              bg-slate-50 dark:bg-[#12141f]
              text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              border border-slate-300 dark:border-slate-700
              hover:border-purple-400 dark:hover:border-purple-600
              focus:outline-none focus:border-purple-600 dark:focus:border-purple-500
              focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/30
              focus:bg-white dark:focus:bg-[#181a29]
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${error ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
              ${className}`}
            style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
