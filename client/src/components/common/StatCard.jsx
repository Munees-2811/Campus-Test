import React from 'react';
import Card, { CardBody } from './Card';

const StatCard = ({
  title,
  value,
  description,
  subtitle,       // alias for description
  icon: Icon,
  variant,        // 'primary' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'navy' | 'violet'
  accentColor,    // legacy alias for variant
  badgeText,
  trend,          // { value: '+12%', up: true }
}) => {
  const colorKey = variant || accentColor || 'primary';

  const themes = {
    primary:  'bg-electric-50 text-electric-600 dark:bg-electric-950/70 dark:text-electric-400 border-electric-100 dark:border-electric-900',
    electric: 'bg-electric-50 text-electric-600 dark:bg-electric-950/70 dark:text-electric-400 border-electric-100 dark:border-electric-900',
    emerald:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    amber:    'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border-amber-100 dark:border-amber-900',
    rose:     'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border-rose-100 dark:border-rose-900',
    indigo:   'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900',
    violet:   'bg-violet-50 text-violet-600 dark:bg-violet-950/70 dark:text-violet-400 border-violet-100 dark:border-violet-900',
    cyan:     'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/70 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900',
    navy:     'bg-navy-100 text-navy-800 dark:bg-navy-800 dark:text-electric-300 border-navy-200 dark:border-navy-700',
  };

  const desc = description || subtitle;

  return (
    <Card hover className="relative">
      <CardBody className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              {title}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {value}
              </h3>
              {badgeText && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                  {badgeText}
                </span>
              )}
              {trend && (
                <span className={`text-[11px] font-semibold ${trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {trend.value}
                </span>
              )}
            </div>
          </div>

          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs flex-shrink-0 ${
              themes[colorKey] ?? themes.primary
            }`}
          >
            {Icon && <Icon className="w-5 h-5" />}
          </div>
        </div>

        {desc && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-navy-800/80">
            {desc}
          </p>
        )}
      </CardBody>
    </Card>
  );
};

export default StatCard;
