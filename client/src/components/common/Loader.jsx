import React from 'react';

const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Spinner ring */}
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-navy-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
      </div>
      {message && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b1120]">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Campus<span className="text-blue-600 dark:text-blue-400">Test</span>
          </span>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-10">
      {content}
    </div>
  );
};

export default Loader;
