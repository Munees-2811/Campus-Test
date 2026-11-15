import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../components/common/Button';
import Card, { CardBody } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center p-4 transition-colors">
      <Card className="max-w-md w-full text-center p-8 space-y-5 border-slate-200 dark:border-navy-800 shadow-lg">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Access Restricted (403)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your authenticated role does not have authorization to view this section of the campus platform.
          </p>
        </div>
        <Button variant="primary" onClick={handleReturn} className="w-full">
          Return to Authorized Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default Unauthorized;
