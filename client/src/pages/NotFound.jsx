import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center p-4 transition-colors">
      <Card className="max-w-md w-full text-center p-8 space-y-5 border-slate-200 dark:border-navy-800 shadow-lg">
        <div className="w-14 h-14 bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <HelpCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <span className="text-3xl font-extrabold text-electric-600 dark:text-electric-400">404</span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Page Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The requested assessment or page could not be located.
          </p>
        </div>
        <Link to="/login" className="block w-full">
          <Button variant="primary" className="w-full">
            Back to Campus Home
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
