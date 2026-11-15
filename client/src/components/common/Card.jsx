import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-navy-900 rounded-xl border border-slate-200/90 dark:border-navy-800 shadow-xs overflow-hidden ${
        hover ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-navy-700' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-slate-100 dark:border-navy-800 ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-5 py-3.5 bg-slate-50/80 dark:bg-navy-850/60 border-t border-slate-100 dark:border-navy-800 ${className}`}>
    {children}
  </div>
);

export default Card;
