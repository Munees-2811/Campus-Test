import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variants = {
    primary: 'bg-electric-600 hover:bg-electric-700 text-white shadow-sm hover:shadow-glow-sm focus:ring-electric-500 dark:focus:ring-offset-navy-950',
    navy: 'bg-navy-900 hover:bg-navy-850 text-white border border-navy-750 dark:bg-navy-800 dark:hover:bg-navy-750 focus:ring-navy-700 shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 dark:bg-navy-850 dark:hover:bg-navy-800 dark:text-slate-200 dark:border-navy-750 focus:ring-slate-400',
    outline: 'border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-850 focus:ring-electric-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-slate-100 focus:ring-slate-400',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500'
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 gap-1',
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
