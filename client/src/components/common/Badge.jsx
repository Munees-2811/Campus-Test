import React from 'react';

const Badge = ({ children, variant = 'default', size = 'sm', dot = false, className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:border-navy-700',
    primary: 'bg-electric-50 text-electric-700 border-electric-200 dark:bg-electric-950/60 dark:text-electric-300 dark:border-electric-800/80',
    admin: 'bg-navy-100 text-navy-900 border-navy-200 dark:bg-navy-800 dark:text-electric-300 dark:border-navy-700 font-semibold',
    student: 'bg-electric-50 text-electric-800 border-electric-200 dark:bg-electric-950/70 dark:text-electric-300 dark:border-electric-800 font-semibold',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80',
  };

  const dots = {
    default: 'bg-slate-400',
    primary: 'bg-electric-500',
    admin: 'bg-navy-700 dark:bg-electric-400',
    student: 'bg-electric-600 dark:bg-electric-400',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs px-3 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${variants[variant] || variants.default} ${sizes[size] || sizes.sm} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant] || dots.default}`} />}
      {children}
    </span>
  );
};

export default Badge;
