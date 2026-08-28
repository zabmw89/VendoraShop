import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Zap,
  Terminal
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
const TestRunnerPage = () => {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const { showToast } = useToast();
  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const data = await api.runTests();
      setResults(data);
      if (data.failed === 0) {
        showToast(`All ${data.passed} automated tests passed!`, "success");
      } else {
        showToast(`${data.failed} test(s) failed. Check details below.`, "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to run test suite", "error");
    } finally {
      setIsRunning(false);
    }
  };
  useEffect(() => {
    handleRunTests();
  }, []);
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {
    /* Header */
  }
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-4 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-green-400">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-tight">Automated Regression Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Backend Integration Tests</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Verifies critical business logic: Authentication, Cart Mutators, Atomic Inventory Decrements, Order Validation, and Swagger Schemas.
          </p>
        </div>

        <button
    onClick={handleRunTests}
    disabled={isRunning}
    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
  >
          {isRunning ? <>
              <RotateCcw className="w-4 h-4 animate-spin" /> Running Tests...
            </> : <>
              <Play className="w-4 h-4 fill-white" /> Execute Test Suite
            </>}
        </button>
      </div>

      {
    /* Test Stats Header */
  }
      {results && <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
              Total Tests
            </span>
            <span className="text-2xl font-bold text-slate-900">{results.total}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-green-600 uppercase tracking-tight block">
              Passed
            </span>
            <span className="text-2xl font-bold text-green-600">{results.passed}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-tight block">
              Failed
            </span>
            <span className="text-2xl font-bold text-rose-600">{results.failed}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block">
              Execution Time
            </span>
            <span className="text-2xl font-bold text-blue-600">{results.durationMs}ms</span>
          </div>
        </div>}

      {
    /* Tests Results List */
  }
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Terminal className="w-4 h-4 text-blue-600" />
          Test Assertion Results
        </h3>

        {isRunning && !results ? <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Executing test suites against the backend API...
          </div> : <div className="space-y-3">
            {results?.results?.map((test, idx) => <div
    key={idx}
    className={`p-4 rounded-lg border flex items-start justify-between gap-4 transition-colors ${test.status === "passed" ? "bg-green-50/40 border-green-200/80 text-slate-900" : "bg-rose-50/40 border-rose-200 text-slate-900"}`}
  >
                <div className="flex items-start gap-3 min-w-0">
                  {test.status === "passed" ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                  <div>
                    <h4 className="text-xs font-semibold">{test.name}</h4>
                    {test.details && <p className="text-[11px] text-slate-500 font-mono mt-0.5">{test.details}</p>}
                    {test.error && <p className="text-[11px] text-rose-600 font-mono mt-1 bg-white p-2 rounded border border-rose-200">
                        {test.error}
                      </p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    {test.durationMs}ms
                  </span>
                  <span
    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${test.status === "passed" ? "bg-green-100 text-green-800" : "bg-rose-100 text-rose-800"}`}
  >
                    {test.status}
                  </span>
                </div>
              </div>)}
          </div>}
      </div>
    </div>;
};
export {
  TestRunnerPage
};
