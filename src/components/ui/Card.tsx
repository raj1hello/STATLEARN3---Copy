import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#11131f] rounded-2xl shadow-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800/80 p-6
        ${hover ? "transition-shadow duration-200 hover:shadow-card-hover hover:border-purple-100 dark:hover:border-purple-800/60 cursor-pointer" : ""}
        ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; icon?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
  icon,
}) => {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-xl text-purple-700 dark:text-purple-300">{icon}</div>}
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
};
