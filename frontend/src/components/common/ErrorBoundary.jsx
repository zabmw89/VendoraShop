import { Component } from "react";
import { AlertTriangle, RefreshCw, Home, Copy, Check, ChevronDown, ChevronUp, Terminal, Bug } from "lucide-react";
import { logError } from "../../utils/logger";
import { initPerformanceMonitoring } from "../../utils/performance";
class ErrorBoundary extends Component {
  disconnectPerformance;
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false
  };
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.disconnectPerformance = initPerformanceMonitoring();
  }
  componentWillUnmount() {
    if (this.disconnectPerformance) {
      this.disconnectPerformance();
    }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    logError(error, {
      componentStack: errorInfo.componentStack || void 0,
      errorType: "react_boundary",
      metadata: {
        boundaryName: this.props.name || "GlobalErrorBoundary"
      }
    });
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
  }
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  handleGoHome = () => {
    this.resetError();
    window.location.hash = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  handleCopyDiagnostics = () => {
    const { error, errorInfo } = this.state;
    const diagnosticText = `--- VENDORA ERROR DIAGNOSTICS ---
Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Name: ${error?.name || "Error"}
Error Message: ${error?.message || "No message provided"}

Stack Trace:
${error?.stack || "No stack trace available"}

Component Stack:
${errorInfo?.componentStack || "No component stack available"}
---------------------------------`;
    navigator.clipboard.writeText(diagnosticText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      if (this.props.fallbackRender && this.state.error) {
        return this.props.fallbackRender(this.state.error, this.resetError);
      }
      const { error, errorInfo, showDetails, copied } = this.state;
      return <div className="min-h-115 w-full flex items-center justify-center p-4 sm:p-8" id="global-error-fallback">
          <div className="max-w-2xl w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 sm:p-10 space-y-6 text-center sm:text-left">
            {
        /* Header Badge & Alert Icon */
      }
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
                  <Bug className="w-3.5 h-3.5" /> Application Resilience Shield
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Something unexpected occurred
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We encountered an issue rendering this section. A diagnostic trace has been automatically reported to our monitoring endpoint so our engineers can investigate.
                </p>
              </div>
            </div>

            {
        /* Action Buttons */
      }
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <button
        onClick={this.resetError}
        id="error-boundary-retry-btn"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
      >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>

              <button
        onClick={this.handleGoHome}
        id="error-boundary-home-btn"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all cursor-pointer active:scale-95"
      >
                <Home className="w-4 h-4" /> Go to Catalog Home
              </button>

              <button
        onClick={() => window.location.reload()}
        id="error-boundary-reload-btn"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all cursor-pointer"
      >
                Reload Page
              </button>
            </div>

            {
        /* Diagnostic Details Accordion */
      }
            <div className="pt-2 border-t border-slate-100">
              <button
        onClick={() => this.setState({ showDetails: !showDetails })}
        id="error-boundary-toggle-details"
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 transition-colors cursor-pointer"
      >
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  Technical Diagnostic Trace
                </span>
                {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showDetails && <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Error Payload & Stack
                    </span>
                    <button
        onClick={this.handleCopyDiagnostics}
        id="error-boundary-copy-btn"
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
      >
                      {copied ? <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied to Clipboard!
                        </> : <>
                          <Copy className="w-3.5 h-3.5" /> Copy Diagnostics
                        </>}
                    </button>
                  </div>

                  <div className="bg-slate-900 text-slate-200 rounded-xl p-4 text-xs font-mono overflow-x-auto max-h-64 scrollbar-thin border border-slate-800 space-y-2">
                    <div className="text-rose-400 font-semibold">
                      {error?.name || "Error"}: {error?.message}
                    </div>
                    {error?.stack && <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed">
                        {error.stack}
                      </pre>}
                    {errorInfo?.componentStack && <div className="pt-2 border-t border-slate-800">
                        <div className="text-slate-400 font-semibold text-[10px] uppercase mb-1">
                          Component Tree Hierarchy:
                        </div>
                        <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>}
                  </div>
                </div>}
            </div>
          </div>
        </div>;
    }
    return this.props.children;
  }
}
export {
  ErrorBoundary
};
