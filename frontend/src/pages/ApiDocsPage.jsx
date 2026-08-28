import { useEffect, useState } from "react";
import {
  Code2,
  ChevronDown,
  ChevronRight,
  Play
} from "lucide-react";
import { api } from "../services/api";
const ApiDocsPage = () => {
  const [spec, setSpec] = useState(null);
  const [activeTag, setActiveTag] = useState("All");
  const [expandedEndpoints, setExpandedEndpoints] = useState({});
  const [testResponses, setTestResponses] = useState({});
  const [testingEndpoints, setTestingEndpoints] = useState({});
  useEffect(() => {
    api.getApiDocs().then(setSpec).catch(console.error);
  }, []);
  const toggleEndpoint = (key) => {
    setExpandedEndpoints((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const executeLiveTest = async (method, path, key) => {
    setTestingEndpoints((prev) => ({ ...prev, [key]: true }));
    try {
      let url = path;
      if (url.includes("{id}")) {
        url = url.replace("{id}", "prod_1");
      }
      const token = localStorage.getItem("vendora_token");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      let body = void 0;
      if (method === "post" && path.includes("/cart/items")) {
        body = JSON.stringify({ productId: "prod_1", quantity: 1 });
      }
      const startTime = performance.now();
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body
      });
      const durationMs = Math.round(performance.now() - startTime);
      const data = await res.json().catch(() => ({}));
      setTestResponses((prev) => ({
        ...prev,
        [key]: {
          status: res.status,
          statusText: res.statusText,
          durationMs,
          data
        }
      }));
    } catch (err) {
      setTestResponses((prev) => ({
        ...prev,
        [key]: {
          status: 500,
          error: err.message
        }
      }));
    } finally {
      setTestingEndpoints((prev) => ({ ...prev, [key]: false }));
    }
  };
  if (!spec) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400 animate-pulse">
        Loading OpenAPI specification...
      </div>;
  }
  const paths = Object.entries(spec.paths || {});
  const tags = ["All", "Authentication", "Products", "Cart", "Orders", "Admin", "AI Assistant"];
  const getMethodColor = (m) => {
    switch (m.toLowerCase()) {
      case "get":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "post":
        return "bg-green-50 text-green-700 border-green-200";
      case "put":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "delete":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {
    /* Header */
  }
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 space-y-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-2 text-blue-400">
          <Code2 className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-tight">RESTful API Contract</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">{spec.info?.title || "Vendora REST API"}</h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          {spec.info?.description}
        </p>
        <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
          <span>Version: <strong className="text-white">{spec.info?.version}</strong></span>
          <span>OpenAPI: <strong className="text-white">{spec.openapi}</strong></span>
          <span>Base Server: <strong className="text-blue-300 font-mono">/api</strong></span>
        </div>
      </div>

      {
    /* Tag filters */
  }
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tags.map((t) => <button
    key={t}
    onClick={() => setActiveTag(t)}
    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTag === t ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
  >
            {t}
          </button>)}
      </div>

      {
    /* Endpoints List */
  }
      <div className="space-y-4">
        {paths.map(([pathUrl, methods]) => {
    return Object.entries(methods).map(([method, details]) => {
      const endpointTag = details.tags?.[0] || "General";
      if (activeTag !== "All" && endpointTag !== activeTag) return null;
      const endpointKey = `${method.toUpperCase()}_${pathUrl}`;
      const isExpanded = !!expandedEndpoints[endpointKey];
      const testResult = testResponses[endpointKey];
      const isTesting = testingEndpoints[endpointKey];
      return <div
        key={endpointKey}
        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
      >
                {
        /* Endpoint Header Bar */
      }
                <div
        onClick={() => toggleEndpoint(endpointKey)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
      >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-tight border ${getMethodColor(method)}`}>
                      {method}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 truncate">
                      {pathUrl}
                    </span>
                    <span className="text-xs text-slate-500 hidden md:inline truncate">
                      — {details.summary}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {endpointTag}
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {
        /* Expanded Details & Live Runner */
      }
                {isExpanded && <div className="p-5 bg-slate-50/70 border-t border-slate-200 space-y-4 text-xs">
                    <p className="text-slate-600">{details.description || details.summary}</p>

                    {
        /* Parameters if any */
      }
                    {details.parameters && <div className="space-y-1.5">
                        <span className="font-bold text-slate-800 uppercase text-[10px] tracking-tight block">
                          Parameters
                        </span>
                        <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                          {details.parameters.map((param) => <div key={param.name} className="flex justify-between items-center text-slate-600">
                              <span className="font-mono font-bold text-slate-900">{param.name} ({param.in})</span>
                              <span className="text-[11px] text-slate-500">{param.description}</span>
                            </div>)}
                        </div>
                      </div>}

                    {
        /* Request Body sample */
      }
                    {details.requestBody && <div className="space-y-1.5">
                        <span className="font-bold text-slate-800 uppercase text-[10px] tracking-tight block">
                          Request Schema (JSON)
                        </span>
                        <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                          {JSON.stringify(details.requestBody.content?.["application/json"]?.schema || {}, null, 2)}
                        </pre>
                      </div>}

                    {
        /* Try it live button */
      }
                    <div className="flex items-center justify-between pt-2">
                      <button
        onClick={() => executeLiveTest(method, pathUrl, endpointKey)}
        disabled={isTesting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        {isTesting ? "Sending Request..." : "Send Live API Request"}
                      </button>
                    </div>

                    {
        /* Test Response Output Box */
      }
                    {testResult && <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className={`font-bold ${testResult.status < 300 ? "text-green-600" : "text-rose-600"}`}>
                            HTTP {testResult.status} {testResult.statusText || ""}
                          </span>
                          <span className="text-slate-400">{testResult.durationMs}ms</span>
                        </div>
                        <pre className="bg-slate-950 text-green-400 p-4 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                          {JSON.stringify(testResult.data || testResult.error, null, 2)}
                        </pre>
                      </div>}
                  </div>}
              </div>;
    });
  })}
      </div>
    </div>;
};
export {
  ApiDocsPage
};
