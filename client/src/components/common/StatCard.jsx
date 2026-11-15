import React from 'react';
import Card, { CardBody } from './Card';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'primary',
  accentColor = 'electric', // 'electric', 'emerald', 'amber', 'navy'
}) => {
  const iconThemes = {
    electric: 'bg-electric-50 text-electric-600 dark:bg-electric-950/70 dark:text-electric-400 border-electric-100 dark:border-electric-900',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 border-amber-100 dark:border-amber-900',
    navy: 'bg-navy-100 text-navy-800 dark:bg-navy-800 dark:text-electric-300 border-navy-200 dark:border-navy-700',
  };

  return (
    <Card hover className="relative">
      <CardBody className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              {title}
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {value}
              </h3>
              {badgeText && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                  {badgeText}
                </span>
              )}
            </div>
          </div>

          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${
              iconThemes[accentColor] || iconThemes.electric
            }`}
          >
            {Icon && <Icon className="w-5 h-5" />}
          </div>
        </div>

        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-navy-800/80">
            {subtitle}
          </p>
        )}
      </CardBody>
    </Card>
  );
};

export default StatCard;
