import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import {
  Code2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Check,
  Copy
} from 'lucide-react';

const LANGUAGE_LABELS = {
  javascript: 'JavaScript (Node.js)',
  python: 'Python 3',
  java: 'Java (OpenJDK)',
  cpp: 'C++ (GCC)',
  c: 'C (GCC)',
  sql: 'PostgreSQL / SQL'
};

const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  js: 'javascript',
  python: 'python',
  python3: 'python',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  sql: 'sql'
};

export const CodeEditor = ({
  language = 'javascript',
  value = '',
  onChange,
  onLanguageChange,
  height = '420px',
  readOnly = false,
  starterCode = '',
  className = ''
}) => {
  const { theme } = useTheme();
  const [fontSize, setFontSize] = useState(13);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);

  const normalizedLang = String(language).toLowerCase();
  const monacoLanguage = MONACO_LANGUAGE_MAP[normalizedLang] || 'javascript';
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    if (starterCode && window.confirm('Reset code to initial template? Any unsaved edits will be discarded.')) {
      onChange(starterCode);
    }
  };

  const zoomIn = () => setFontSize((prev) => Math.min(22, prev + 1));
  const zoomOut = () => setFontSize((prev) => Math.max(11, prev - 1));

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-navy-950 p-4'
          : 'border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-xs'
      } ${className}`}
    >
      {/* Editor Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-100/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-navy-800 text-xs">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-electric-600 dark:text-electric-400" />
          {onLanguageChange ? (
            <select
              value={normalizedLang}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="py-1 px-2.5 rounded-md font-mono text-xs font-semibold bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric-500"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python 3</option>
              <option value="java">Java</option>
              <option value="cpp">C++ (GCC)</option>
              <option value="c">C (GCC)</option>
              <option value="sql">SQL</option>
            </select>
          ) : (
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {LANGUAGE_LABELS[normalizedLang] || normalizedLang}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Font Controls */}
          <button
            type="button"
            onClick={zoomOut}
            title="Decrease font size"
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-navy-800"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1">{fontSize}px</span>
          <button
            type="button"
            onClick={zoomIn}
            title="Increase font size"
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-navy-800"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-3.5 bg-slate-300 dark:bg-navy-700 mx-1" />

          {/* Reset Template */}
          {starterCode && !readOnly && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset to starter template"
              className="p-1 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded hover:bg-slate-200/60 dark:hover:bg-navy-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-navy-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen editor'}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-navy-800"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}>
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          theme={editorTheme}
          onChange={(newVal) => onChange && onChange(newVal || '')}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: monacoLanguage === 'javascript' ? 2 : 4,
            wordWrap: 'on',
            lineNumbers: 'on',
            roundedSelection: true,
            cursorBlinking: 'smooth',
            lineDecorationsWidth: 6,
            lineNumbersMinChars: 3,
            formatOnPaste: true,
            renderWhitespace: 'selection',
            smoothScrolling: true
          }}
          loading={
            <div className="h-full flex items-center justify-center p-8 bg-slate-950 text-slate-400 font-mono text-xs">
              Loading Monaco Code Editor...
            </div>
          }
        />
      </div>

      {/* Editor Status Bar Footer */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-100/90 dark:bg-navy-950/90 border-t border-slate-200/80 dark:border-navy-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>CampusTest Code Arena</span>
          <span>•</span>
          <span className="text-electric-600 dark:text-electric-400 uppercase font-semibold">
            {monacoLanguage}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>UTF-8</span>
          <span>•</span>
          <span>{readOnly ? 'READ ONLY' : 'EDITABLE'}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
