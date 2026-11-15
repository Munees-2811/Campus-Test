import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="relative">
        <Loader2 className="w-8 h-8 text-electric-600 dark:text-electric-400 animate-spin" />
        <div className="absolute inset-0 rounded-full blur-sm bg-electric-500/20 animate-pulse pointer-events-none" />
      </div>
      {message && (
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-navy-950/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
