/**
 * Judge0 API Integration Service
 * Supports C, C++, Java, Python, and JavaScript code execution
 */

const LANGUAGE_MAP = {
  c: 50,           // C (GCC 9.2.0)
  cpp: 54,         // C++ (GCC 9.2.0)
  'c++': 54,
  java: 62,        // Java (OpenJDK 13.0.1)
  python: 71,      // Python (3.8.1)
  python3: 71,
  py: 71,
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  js: 63,
  node: 63,
  nodejs: 63
};

const getLanguageId = (lang) => {
  if (!lang) return 63; // Default JavaScript
  const normalized = String(lang).trim().toLowerCase();
  return LANGUAGE_MAP[normalized] || 63;
};

const encodeBase64 = (str) => {
  if (str === null || str === undefined) return '';
  return Buffer.from(String(str), 'utf-8').toString('base64');
};

const decodeBase64 = (b64) => {
  if (!b64) return '';
  try {
    return Buffer.from(String(b64), 'base64').toString('utf-8');
  } catch {
    return String(b64);
  }
};

/**
 * Fallback executor for local JavaScript execution (used when Judge0 API key is not configured or offline)
 */
const runLocalJavaScript = (sourceCode, stdin = '') => {
  const startTime = Date.now();
  let logs = [];
  let errorOutput = '';
  let status = { id: 3, description: 'Accepted' };

  try {
    const vm = require('vm');
    const mockFs = {
      readFileSync: (fd) => {
        if (fd === 0 || fd === '0' || fd === '/dev/stdin') return stdin;
        return stdin;
      }
    };

    const sandbox = {
      console: {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        warn: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      },
      require: (mod) => {
        if (mod === 'fs') return mockFs;
        return {};
      },
      fs: mockFs,
      input: stdin,
      stdin: stdin,
      process: {
        env: {},
        exit: () => {},
        stdin: {
          on: (event, cb) => {
            if (event === 'data') cb(stdin);
            if (event === 'end') cb();
          }
        }
      }
    };

    const context = vm.createContext(sandbox);
    const script = new vm.Script(sourceCode);
    script.runInContext(context, { timeout: 3000 });
  } catch (err) {
    status = { id: 11, description: 'Runtime Error' };
    errorOutput = err.message || 'Execution error';
  }

  const duration = (Date.now() - startTime) / 1000;
  return {
    stdout: logs.join('\n'),
    stderr: errorOutput,
    compile_output: '',
    time: duration.toFixed(3),
    memory: 2048,
    status
  };
};

/**
 * Execute a single piece of code via Judge0 API
 */
const executeCode = async ({
  sourceCode,
  language,
  stdin = '',
  expectedOutput = null,
  cpuTimeLimit = 5,
  memoryLimit = 256000
}) => {
  const languageId = getLanguageId(language);
  const configuredUrl = (process.env.JUDGE0_API_URL || '').replace(/\/+$/, '');
  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

  const isKeyConfigured = apiKey && apiKey !== 'your_rapidapi_key_here' && apiKey.length > 5;
  const isRapidApiUrl = configuredUrl.includes('rapidapi.com');

  // Use configured RapidAPI URL when key is present; otherwise use configured non-RapidAPI URL or public Judge0 CE
  const apiUrl = isKeyConfigured
    ? (configuredUrl || 'https://judge0-ce.p.rapidapi.com')
    : (!isRapidApiUrl && configuredUrl ? configuredUrl : 'https://ce.judge0.com');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (isKeyConfigured && isRapidApiUrl) {
    headers['x-rapidapi-key'] = apiKey;
    headers['x-rapidapi-host'] = apiHost;
  }

  const requestBody = {
    source_code: encodeBase64(sourceCode),
    language_id: languageId,
    stdin: encodeBase64(stdin),
    cpu_time_limit: Number(cpuTimeLimit) || 5,
    memory_limit: Number(memoryLimit) || 256000
  };

  if (expectedOutput) {
    requestBody.expected_output = encodeBase64(expectedOutput);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[Judge0] HTTP Error:', response.status, errText);

      // Fallback for JS
      if (getLanguageId(language) === 63) {
        return runLocalJavaScript(sourceCode, stdin);
      }

      return {
        stdout: '',
        stderr: `Judge0 execution service returned HTTP ${response.status}: ${errText}`,
        compile_output: '',
        time: '0',
        memory: 0,
        status: { id: 13, description: `Service Error (${response.status})` }
      };
    }

    let data = await response.json();

    // Poll if Judge0 returned In Queue (1) or Processing (2)
    if (data.token && data.status?.id <= 2) {
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(`${apiUrl}/submissions/${data.token}?base64_encoded=true`, { headers });
        if (!pollRes.ok) break;
        data = await pollRes.json();
        if (data.status?.id > 2) break;
      }
    }

    return {
      stdout: decodeBase64(data.stdout),
      stderr: decodeBase64(data.stderr),
      compile_output: decodeBase64(data.compile_output),
      message: decodeBase64(data.message),
      time: data.time || '0.000',
      memory: data.memory || 0,
      status: data.status || { id: 3, description: 'Accepted' },
      token: data.token
    };
  } catch (err) {
    console.error('[Judge0] Execution exception:', err.message);

    // Fallback if network blocks or aborts
    if (getLanguageId(language) === 63) {
      return runLocalJavaScript(sourceCode, stdin);
    }

    return {
      stdout: '',
      stderr: `Code execution request failed: ${err.message}`,
      compile_output: '',
      time: '0',
      memory: 0,
      status: { id: 13, description: 'Execution Request Failed' }
    };
  }
};

/**
 * Run source code against a suite of public and hidden test cases
 */
const runAgainstTestCases = async ({ sourceCode, language, testCases = [] }) => {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return {
      passed: true,
      passedCount: 1,
      totalCount: 1,
      executionTime: '0.010',
      memoryUsed: 1024,
      status: 'Accepted',
      results: [{
        testCaseIndex: 1,
        input: '',
        expectedOutput: '',
        actualOutput: 'Completed',
        passed: true,
        time: '0.010',
        memory: 1024,
        status: 'Accepted',
        isHidden: false
      }]
    };
  }

  const results = [];
  let passedCount = 0;
  let maxTime = 0;
  let maxMemory = 0;
  let overallStatus = 'Accepted';

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const input = tc.input || '';
    const expected = (tc.expectedOutput || '').trim();

    const execRes = await executeCode({
      sourceCode,
      language,
      stdin: input,
      expectedOutput: expected
    });

    // Normalized whitespace comparison (handles trailing newlines, CRLF, extra spaces)
    const normalize = (s) => (s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n+$/, '').trim();
    const actual = (execRes.stdout || '').trim();
    const isMatchingOutput = expected ? normalize(execRes.stdout) === normalize(expected) : true;
    const isExecutionSuccessful = execRes.status?.id === 3 && !execRes.compile_output;
    const passed = isMatchingOutput && isExecutionSuccessful;

    if (passed) {
      passedCount++;
    } else if (overallStatus === 'Accepted') {
      if (execRes.compile_output) overallStatus = 'Compilation Error';
      else if (execRes.status?.id === 5) overallStatus = 'Time Limit Exceeded';
      else if (execRes.stderr || execRes.status?.id >= 7) overallStatus = 'Runtime Error';
      else overallStatus = 'Wrong Answer';
    }

    const tFloat = parseFloat(execRes.time) || 0;
    if (tFloat > maxTime) maxTime = tFloat;
    if (execRes.memory > maxMemory) maxMemory = execRes.memory;

    let caseStatus = 'Wrong Answer';
    if (passed) {
      caseStatus = 'Accepted';
    } else if (execRes.compile_output || execRes.status?.id === 6) {
      caseStatus = 'Compilation Error';
    } else if (execRes.status?.id === 5) {
      caseStatus = 'Time Limit Exceeded';
    } else if (execRes.stderr || (execRes.status?.id && execRes.status.id >= 7)) {
      caseStatus = execRes.status?.description || 'Runtime Error';
    }

    results.push({
      testCaseIndex: i + 1,
      input: tc.isHidden ? '[HIDDEN TEST CASE]' : input,
      expectedOutput: tc.isHidden ? '[HIDDEN]' : expected,
      actualOutput: tc.isHidden ? (passed ? '[PASSED]' : '[FAILED]') : normalize(execRes.stdout),
      passed,
      time: execRes.time,
      memory: execRes.memory,
      status: caseStatus,
      compileOutput: tc.isHidden ? null : execRes.compile_output,
      stderr: tc.isHidden ? null : execRes.stderr,
      isHidden: !!tc.isHidden
    });
  }

  return {
    passed: passedCount === testCases.length,
    passedCount,
    totalCount: testCases.length,
    executionTime: maxTime.toFixed(3),
    memoryUsed: maxMemory,
    status: overallStatus,
    results
  };
};

module.exports = {
  LANGUAGE_MAP,
  getLanguageId,
  executeCode,
  runAgainstTestCases
};
