import React, { useState } from 'react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import adminService from '../../services/adminService';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Users
} from 'lucide-react';

const SAMPLE_CSV = `name,email,rollNumber,department,password
David Miller,david.m@campus.edu,CS-2026-101,Computer Science,Password123!
Emma Watson,emma.w@campus.edu,CS-2026-102,Information Technology,Password123!
Sophia Taylor,sophia.t@campus.edu,EE-2026-201,Electrical Engineering,
Liam Anderson,liam.a@campus.edu,ME-2026-301,Mechanical Engineering,`;

const BulkStudentImportView = ({ onBackToDirectory }) => {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsingError, setParsingError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Parse CSV string into array of objects
  const parseCSV = (text) => {
    try {
      const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one student row.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('name');
      const emailIdx = headers.indexOf('email');
      const rollIdx = headers.indexOf('rollnumber') !== -1 ? headers.indexOf('rollnumber') : headers.indexOf('roll');
      const deptIdx = headers.indexOf('department') !== -1 ? headers.indexOf('department') : headers.indexOf('dept');
      const pwdIdx = headers.indexOf('password');

      if (nameIdx === -1 || emailIdx === -1) {
        throw new Error('CSV header must contain "name" and "email" columns.');
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        const name = parts[nameIdx] || '';
        const email = parts[emailIdx] || '';
        const rollNumber = rollIdx !== -1 ? parts[rollIdx] || '' : '';
        const department = deptIdx !== -1 ? parts[deptIdx] || 'General' : 'General';
        const password = pwdIdx !== -1 ? parts[pwdIdx] || '' : '';

        const isValid = !!name && !!email && email.includes('@') && email.includes('.');

        rows.push({
          id: i,
          name,
          email,
          rollNumber,
          department,
          password,
          isValid,
          validationIssue: !isValid
            ? !name
              ? 'Missing Name'
              : 'Invalid Email Address'
            : null
        });
      }

      setParsedRows(rows);
      setParsingError('');
    } catch (err) {
      setParsingError(err.message || 'Failed to parse CSV file.');
      setParsedRows([]);
    }
  };

  const handleFileUpload = (e) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    if (!uploaded.name.endsWith('.csv')) {
      setParsingError('Please select a valid .csv file.');
      return;
    }

    setFile(uploaded);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      parseCSV(event.target.result);
    };
    reader.readAsText(uploaded);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'campustest_students_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setParsingError('No valid student rows to import.');
      return;
    }

    try {
      setIsImporting(true);
      setParsingError('');
      const res = await adminService.bulkImportStudents(validRows);
      setImportResults(res);
    } catch (err) {
      setParsingError(err.message || 'Failed to complete bulk import.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setImportResults(null);
    setParsingError('');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-electric-500" />
            Bulk Student Import
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload institutional CSV rosters to provision batches of students in one click
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSample}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample Template (.CSV)</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToDirectory}
            className="text-xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Directory</span>
          </Button>
        </div>
      </div>

      {parsingError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{parsingError}</span>
        </div>
      )}

      {/* Completed Results Summary Banner */}
      {importResults && (
        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardBody className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {importResults.message}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {importResults.results?.imported} students imported, {importResults.results?.skipped} skipped.
                  </p>
                </div>
              </div>

              <Button variant="primary" size="sm" onClick={onBackToDirectory}>
                <span>View Directory</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>

            {importResults.results?.errors?.length > 0 && (
              <div className="p-3 bg-white dark:bg-navy-900 rounded-lg border border-slate-200 dark:border-navy-750 text-xs space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Skipped Rows & Warnings:
                </div>
                <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                  {importResults.results.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* CSV Dropzone & File Selector */}
      {!file ? (
        <Card className="border-dashed border-2 border-slate-300 dark:border-navy-700 hover:border-electric-500 dark:hover:border-electric-500 transition-colors">
          <CardBody className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload Student CSV File
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Select or drag a <code className="text-electric-600 dark:text-electric-400">.csv</code> file containing student columns: name, email, rollNumber, department.
              </p>
            </div>

            <div>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="primary" size="md" className="cursor-pointer" as="span">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                  <span>Choose CSV File</span>
                </Button>
              </label>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500">
              Format: UTF-8 encoded CSV. Default temporary passwords will be assigned if password column is empty.
            </div>
          </CardBody>
        </Card>
      ) : (
        /* Preview Table Before Import */
        <Card className="border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-electric-50 dark:bg-electric-950/70 text-electric-600 dark:text-electric-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {file.name} ({parsedRows.length} rows detected)
                </h4>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {parsedRows.filter((r) => r.isValid).length} ready to import
                  </span>
                  {parsedRows.some((r) => !r.isValid) && (
                    <span className="text-rose-500 font-medium">
                      • {parsedRows.filter((r) => !r.isValid).length} invalid rows
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Choose Different File
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteImport}
                isLoading={isImporting}
                disabled={parsedRows.filter((r) => r.isValid).length === 0}
                className="text-xs"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                <span>Import {parsedRows.filter((r) => r.isValid).length} Students</span>
              </Button>
            </div>
          </CardHeader>

          {/* Table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-850/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-800 uppercase font-semibold tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Roll Number</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                {parsedRows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      !r.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'hover:bg-slate-50/60 dark:hover:bg-navy-850/40'
                    }`}
                  >
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {r.name || <span className="text-rose-500 italic">Empty</span>}
                    </td>
                    <td className="py-2.5 px-4">{r.email}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">{r.rollNumber || 'Auto'}</td>
                    <td className="py-2.5 px-4">{r.department}</td>
                    <td className="py-2.5 px-4">
                      {r.isValid ? (
                        <Badge variant="success">Valid</Badge>
                      ) : (
                        <Badge variant="danger">{r.validationIssue}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BulkStudentImportView;
