import React, { useState, useEffect } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Loader from '../common/Loader';
import adminService from '../../services/adminService';
import {
  Settings,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Sliders,
  Save,
  Server,
  Lock,
  RefreshCw
} from 'lucide-react';

const SettingsView = () => {
  const [settings, setSettings] = useState({
    institutionName: '',
    campusCode: '',
    contactEmail: '',
    passPercentageThreshold: 50,
    defaultTestDuration: 30,
    enableStrictProctoring: true,
    allowLateSubmissions: false,
    databaseStatus: 'Connected (PostgreSQL / Supabase)',
    systemVersion: 'v2.4.0 (Enterprise SaaS)'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getSettings();
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      setError(err.message || 'Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await adminService.updateSettings(settings);
      showNotification('Institution platform settings saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader message="Loading institution settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Institution Identity */}
        <Card className="border-slate-200 dark:border-navy-800 shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-electric-500" />
              Institution Profile & Identity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              General institutional information displayed on student portals and official scorecards
            </p>
          </CardHeader>
          <CardBody className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution Name"
                required
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
              />
              <Input
                label="Campus Code"
                required
                value={settings.campusCode}
                onChange={(e) => setSettings({ ...settings, campusCode: e.target.value })}
              />
            </div>
            <Input
              label="Administrative Contact Email"
              type="email"
              required
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </CardBody>
        </Card>

        {/* 2. Examination Rules & Grading */}
        <Card className="border-slate-200 dark:border-navy-800 shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-electric-500" />
              Examination Governance & Policies
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Default evaluation duration, pass thresholds, and proctoring parameters
            </p>
          </CardHeader>
          <CardBody className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Standard Pass Percentage Threshold (%)"
                type="number"
                min={1}
                max={100}
                value={settings.passPercentageThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passPercentageThreshold: parseInt(e.target.value, 10) || 50
                  })
                }
              />
              <Input
                label="Default Test Duration (Minutes)"
                type="number"
                min={5}
                max={300}
                value={settings.defaultTestDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultTestDuration: parseInt(e.target.value, 10) || 30
                  })
                }
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableStrictProctoring}
                  onChange={(e) =>
                    setSettings({ ...settings, enableStrictProctoring: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-electric-600 focus:ring-electric-500"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Enable Full-Screen Lock & Anti-Cheat Proctoring
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Monitors tab switches, fullscreen departures, and background windows during tests
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowLateSubmissions}
                  onChange={(e) =>
                    setSettings({ ...settings, allowLateSubmissions: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-electric-600 focus:ring-electric-500"
                />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Accept Submissions Past Deadline with Penalty Flag
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Allows students to complete tests after deadline with an automated "Late Submission" tag
                  </div>
                </div>
              </label>
            </div>
          </CardBody>
        </Card>

        {/* 3. System Infrastructure & Telemetry */}
        <Card className="border-slate-200 dark:border-navy-800 shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-navy-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-electric-500" />
              Platform Infrastructure & Database Health
            </h3>
          </CardHeader>
          <CardBody className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-750">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Database Layer:</span>
              </div>
              <Badge variant="success">{settings.databaseStatus}</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-750">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Deployment Engine:</span>
              </div>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {settings.systemVersion}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button variant="primary" type="submit" isLoading={saving} className="px-6">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Platform Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
