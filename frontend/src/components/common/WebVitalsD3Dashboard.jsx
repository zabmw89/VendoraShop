import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Activity, Gauge, TrendingUp, RefreshCw, ShieldCheck, Zap } from "lucide-react";
const WebVitalsD3Dashboard = ({ data, onRefresh }) => {
  const lineChartRef = useRef(null);
  const vitalsBarChartRef = useRef(null);
  const routeChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [tooltip, setTooltip] = useState({
    x: 0,
    y: 0,
    content: "",
    visible: false
  });
  useEffect(() => {
    if (!lineChartRef.current || !data.recentMetrics || data.recentMetrics.length === 0) return;
    const svg = d3.select(lineChartRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;
    const g = svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const metricsCopy = [...data.recentMetrics].reverse().map((d, i) => ({
      index: i,
      time: new Date(d.timestamp),
      pageLoadTime: d.pageLoadTime || 0,
      ttfb: d.ttfb || 0,
      fcp: d.fcp || 0,
      lcp: d.lcp || 0,
      url: d.viewName || d.url || `Session #${i + 1}`
    }));
    const xScale = d3.scaleLinear().domain([0, Math.max(metricsCopy.length - 1, 1)]).range([0, width]);
    const maxVal = d3.max(metricsCopy, (d) => Math.max(d.pageLoadTime, d.ttfb, d.fcp, d.lcp)) || 1e3;
    const yScale = d3.scaleLinear().domain([0, Math.ceil(maxVal * 1.15)]).nice().range([height, 0]);
    g.append("g").attr("class", "grid").attr("opacity", 0.1).call(
      d3.axisLeft(yScale).tickSize(-width).tickFormat(() => "")
    );
    const xAxis = d3.axisBottom(xScale).ticks(Math.min(metricsCopy.length, 6)).tickFormat((d) => `#${Number(d) + 1}`);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}ms`);
    g.append("g").attr("transform", `translate(0,${height})`).attr("color", "#94a3b8").call(xAxis).selectAll("text").attr("font-size", "10px");
    g.append("g").attr("color", "#94a3b8").call(yAxis).selectAll("text").attr("font-size", "10px");
    const gradient = svg.append("defs").append("linearGradient").attr("id", "pageLoadGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.35);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0);
    const areaGen = d3.area().x((d) => xScale(d.index)).y0(height).y1((d) => yScale(d.pageLoadTime)).curve(d3.curveMonotoneX);
    g.append("path").datum(metricsCopy).attr("fill", "url(#pageLoadGradient)").attr("d", areaGen);
    const loadLine = d3.line().x((d) => xScale(d.index)).y((d) => yScale(d.pageLoadTime)).curve(d3.curveMonotoneX);
    g.append("path").datum(metricsCopy).attr("fill", "none").attr("stroke", "#2563eb").attr("stroke-width", 2.5).attr("d", loadLine);
    const ttfbLine = d3.line().x((d) => xScale(d.index)).y((d) => yScale(d.ttfb)).curve(d3.curveMonotoneX);
    g.append("path").datum(metricsCopy).attr("fill", "none").attr("stroke", "#10b981").attr("stroke-width", 2).attr("stroke-dasharray", "4 3").attr("d", ttfbLine);
    metricsCopy.forEach((d) => {
      g.append("circle").attr("cx", xScale(d.index)).attr("cy", yScale(d.pageLoadTime)).attr("r", 4).attr("fill", "#2563eb").attr("stroke", "#ffffff").attr("stroke-width", 1.5).attr("cursor", "pointer").on("mouseenter", (event) => {
        const rect = lineChartRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `<strong>Route:</strong> ${d.url}<br/><strong>Page Load:</strong> ${d.pageLoadTime}ms<br/><strong>TTFB:</strong> ${d.ttfb}ms<br/><strong>LCP:</strong> ${d.lcp}ms`,
            visible: true
          });
        }
      }).on("mouseleave", () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      });
    });
  }, [data, selectedMetric]);
  useEffect(() => {
    if (!vitalsBarChartRef.current) return;
    const svg = d3.select(vitalsBarChartRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 25, right: 20, bottom: 40, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;
    const g = svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const vitalsData = [
      { name: "FCP", actual: data.avgFCP || 820, target: 1800, unit: "ms", status: data.statusOverview?.fcpStatus || "good" },
      { name: "LCP", actual: data.avgLCP || 1450, target: 2500, unit: "ms", status: data.statusOverview?.lcpStatus || "good" },
      { name: "TTFB", actual: data.avgTTFB || 180, target: 800, unit: "ms", status: data.statusOverview?.ttfbStatus || "good" },
      { name: "CLS (x1000)", actual: Math.round((data.avgCLS || 0.02) * 1e3), target: 100, unit: "", status: data.statusOverview?.clsStatus || "good" }
    ];
    const x0 = d3.scaleBand().domain(vitalsData.map((d) => d.name)).rangeRound([0, width]).paddingInner(0.25);
    const x1 = d3.scaleBand().domain(["actual", "target"]).rangeRound([0, x0.bandwidth()]).padding(0.08);
    const maxY = d3.max(vitalsData, (d) => Math.max(d.actual, d.target)) || 2500;
    const y = d3.scaleLinear().domain([0, Math.ceil(maxY * 1.15)]).nice().rangeRound([height, 0]);
    g.append("g").attr("class", "grid").attr("opacity", 0.1).call(
      d3.axisLeft(y).tickSize(-width).tickFormat(() => "")
    );
    g.append("g").attr("transform", `translate(0,${height})`).attr("color", "#94a3b8").call(d3.axisBottom(x0)).selectAll("text").attr("font-size", "11px").attr("font-weight", "600");
    g.append("g").attr("color", "#94a3b8").call(d3.axisLeft(y).ticks(5)).selectAll("text").attr("font-size", "10px");
    const group = g.selectAll(".vital-group").data(vitalsData).enter().append("g").attr("transform", (d) => `translate(${x0(d.name)},0)`);
    group.append("rect").attr("x", x1("actual") || 0).attr("y", (d) => y(d.actual)).attr("width", x1.bandwidth()).attr("height", (d) => height - y(d.actual)).attr("rx", 4).attr("fill", (d) => d.status === "good" ? "#10b981" : d.status === "needs_improvement" ? "#f59e0b" : "#ef4444").attr("opacity", 0.9);
    group.append("rect").attr("x", x1("target") || 0).attr("y", (d) => y(d.target)).attr("width", x1.bandwidth()).attr("height", (d) => height - y(d.target)).attr("rx", 4).attr("fill", "#94a3b8").attr("opacity", 0.4);
    group.append("text").attr("x", (x1("actual") || 0) + x1.bandwidth() / 2).attr("y", (d) => y(d.actual) - 5).attr("text-anchor", "middle").attr("font-size", "9px").attr("font-weight", "bold").attr("fill", "#1e293b").text((d) => `${d.actual}${d.unit}`);
  }, [data]);
  useEffect(() => {
    if (!routeChartRef.current || !data.routeTimings) return;
    const svg = d3.select(routeChartRef.current);
    svg.selectAll("*").remove();
    const margin = { top: 20, right: 35, bottom: 25, left: 90 };
    const width = 500 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;
    const g = svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const routes = data.routeTimings.length > 0 ? data.routeTimings.slice(0, 6) : [
      { route: "home", avgDurationMs: 42, samples: 12 },
      { route: "product", avgDurationMs: 68, samples: 9 },
      { route: "cart", avgDurationMs: 35, samples: 6 },
      { route: "checkout", avgDurationMs: 54, samples: 4 },
      { route: "account", avgDurationMs: 48, samples: 7 },
      { route: "admin", avgDurationMs: 82, samples: 5 }
    ];
    const y = d3.scaleBand().domain(routes.map((d) => d.route)).rangeRound([0, height]).padding(0.25);
    const maxDuration = d3.max(routes, (d) => d.avgDurationMs) || 100;
    const x = d3.scaleLinear().domain([0, Math.ceil(maxDuration * 1.2)]).rangeRound([0, width]);
    g.append("g").attr("color", "#64748b").call(d3.axisLeft(y)).selectAll("text").attr("font-size", "11px").attr("font-weight", "600");
    g.selectAll(".route-bar").data(routes).enter().append("rect").attr("y", (d) => y(d.route) || 0).attr("height", y.bandwidth()).attr("x", 0).attr("width", (d) => x(d.avgDurationMs)).attr("rx", 4).attr("fill", "#3b82f6").attr("opacity", 0.85);
    g.selectAll(".route-val").data(routes).enter().append("text").attr("y", (d) => (y(d.route) || 0) + y.bandwidth() / 2 + 3.5).attr("x", (d) => x(d.avgDurationMs) + 6).attr("font-size", "10px").attr("font-weight", "bold").attr("fill", "#334155").text((d) => `${d.avgDurationMs}ms`);
  }, [data]);
  useEffect(() => {
    if (!donutChartRef.current) return;
    const svg = d3.select(donutChartRef.current);
    svg.selectAll("*").remove();
    const width = 240;
    const height = 240;
    const radius = Math.min(width, height) / 2 - 15;
    const g = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${width / 2},${height / 2})`);
    const statuses = [
      data.statusOverview?.lcpStatus || "good",
      data.statusOverview?.fcpStatus || "good",
      data.statusOverview?.ttfbStatus || "good",
      data.statusOverview?.clsStatus || "good"
    ];
    const goodCount = statuses.filter((s) => s === "good").length;
    const needsImpCount = statuses.filter((s) => s === "needs_improvement").length;
    const poorCount = statuses.filter((s) => s === "poor").length;
    const chartData = [
      { label: "Good (Fast)", count: Math.max(goodCount, 1), color: "#10b981" },
      { label: "Needs Improvement", count: needsImpCount, color: "#f59e0b" },
      { label: "Poor", count: poorCount, color: "#ef4444" }
    ].filter((d) => d.count > 0);
    const pie = d3.pie().value((d) => d.count).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.62).outerRadius(radius).cornerRadius(4).padAngle(0.04);
    const arcs = g.selectAll(".arc").data(pie(chartData)).enter().append("g").attr("class", "arc");
    arcs.append("path").attr("d", arc).attr("fill", (d) => d.data.color).attr("opacity", 0.9);
    const healthPercent = Math.round(goodCount / statuses.length * 100);
    g.append("text").attr("text-anchor", "middle").attr("dy", "-0.1em").attr("font-size", "24px").attr("font-weight", "800").attr("fill", "#0f172a").text(`${healthPercent}%`);
    g.append("text").attr("text-anchor", "middle").attr("dy", "1.3em").attr("font-size", "10px").attr("font-weight", "600").attr("fill", "#64748b").text("HEALTH SCORE");
  }, [data]);
  return <div className="space-y-6">
      {
    /* Header bar with live summary */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Activity className="w-4 h-4 text-blue-300" />
            </span>
            <h3 className="text-base font-bold">Real-Time Core Web Vitals & Load Performance Engine</h3>
          </div>
          <p className="text-xs text-blue-200">
            D3-powered telemetry tracking page load durations, time-to-first-byte (TTFB), paint timings, and layout stability.
          </p>
        </div>

        {onRefresh && <button
    onClick={onRefresh}
    className="self-start sm:self-auto px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/20 cursor-pointer"
  >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live Metrics</span>
          </button>}
      </div>

      {
    /* Grid of 4 D3 Charts */
  }
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {
    /* Chart 1: Time Series Load Times (Area / Line) */
  }
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs relative">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Session Load Time & TTFB Timeline
              </h4>
              <p className="text-[11px] text-slate-500">Historical latency records across active client browser sessions</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span className="text-slate-600">Page Load (ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-emerald-500 inline-block" />
                <span className="text-slate-600">TTFB (ms)</span>
              </div>
            </div>
          </div>

          <div className="w-full h-60 relative">
            <svg ref={lineChartRef} className="w-full h-full" />
            {tooltip.visible && <div
    className="absolute z-10 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl pointer-events-none border border-slate-700 leading-tight"
    style={{ left: Math.min(tooltip.x + 10, 420), top: Math.max(tooltip.y - 40, 10) }}
    dangerouslySetInnerHTML={{ __html: tooltip.content }}
  />}
          </div>
        </div>

        {
    /* Chart 2: Vitals Health Distribution Donut */
  }
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-600" />
              Core Web Vitals Health
            </h4>
            <p className="text-[11px] text-slate-500">Overall score based on Google thresholds</p>
          </div>

          <div className="w-full h-48 flex items-center justify-center">
            <svg ref={donutChartRef} className="w-48 h-48" />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <div className="text-xs font-bold text-emerald-700">Good</div>
              <div className="text-[10px] text-emerald-600 font-medium">Optimal</div>
            </div>
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <div className="text-xs font-bold text-amber-700">Moderate</div>
              <div className="text-[10px] text-amber-600 font-medium">Average</div>
            </div>
            <div className="p-1.5 bg-rose-50 rounded-lg">
              <div className="text-xs font-bold text-rose-700">Poor</div>
              <div className="text-[10px] text-rose-600 font-medium">Lagging</div>
            </div>
          </div>
        </div>

        {
    /* Chart 3: Grouped Bar Chart vs Google Standards */
  }
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Vitals vs Google Target Thresholds
              </h4>
              <p className="text-[11px] text-slate-500">Measured values compared against recommended upper thresholds</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Target</span>
            </div>
          </div>

          <div className="w-full h-60">
            <svg ref={vitalsBarChartRef} className="w-full h-full" />
          </div>
        </div>

        {
    /* Chart 4: Route-Level Navigation Latency */
  }
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                SPA View Transition Latency
              </h4>
              <p className="text-[11px] text-slate-500">Average millisecond duration between route view changes</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Lower is faster</span>
          </div>

          <div className="w-full h-60">
            <svg ref={routeChartRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>;
};
export {
  WebVitalsD3Dashboard
};
