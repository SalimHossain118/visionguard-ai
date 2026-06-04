import React from "react";
import { useSelector } from "react-redux";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  PASS: "#22c55e",
  REWORK: "#f59e0b",
  QUARANTINE: "#ef4444",
  NORMAL: "#22c55e",
  LOW: "#3b82f6",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#f1f5f9",
};

// Custom tooltip for pie chart
const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div style={TOOLTIP_STYLE} className="p-2">
        <p className="font-semibold">{d.name}</p>
        <p>
          {d.value} inspection{d.value !== 1 ? "s" : ""}
        </p>
        <p>{(d.payload.percent * 100).toFixed(1)}% of total</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for score trend
const ScoreTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const score = payload[0]?.value;
    const status = score >= 0.75 ? "DEFECTIVE" : "NORMAL";
    const color = score >= 0.75 ? "#ef4444" : "#22c55e";
    return (
      <div style={TOOLTIP_STYLE} className="p-2">
        <p className="text-slate-400 text-xs">Inspection #{label}</p>
        <p className="font-semibold">Score: {score?.toFixed(3)}</p>
        <p style={{ color }} className="text-xs font-bold">
          {status}
        </p>
        <p className="text-slate-500 text-xs">Threshold: 0.75</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsDashboard() {
  const { history } = useSelector((s) => s.inspection);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-sm">Run some inspections to see analytics</p>
        <p className="text-xs mt-2 text-slate-700">
          Use Sample Images to get started quickly
        </p>
      </div>
    );
  }

  const total = history.length;
  const passCount = history.filter((i) => i.decision === "PASS").length;
  const reworkCount = history.filter((i) => i.decision === "REWORK").length;
  const quarantineCount = history.filter(
    (i) => i.decision === "QUARANTINE",
  ).length;
  const defective = history.filter((i) => i.is_defective).length;
  const passRate = ((passCount / total) * 100).toFixed(1);
  const avgScore = (
    history.reduce((s, i) => s + (i.anomaly_score || 0), 0) / total
  ).toFixed(3);

  // Decision data
  const decisionData = [
    {
      name: "PASS",
      value: passCount,
      pct: ((passCount / total) * 100).toFixed(0),
    },
    {
      name: "REWORK",
      value: reworkCount,
      pct: ((reworkCount / total) * 100).toFixed(0),
    },
    {
      name: "QUARANTINE",
      value: quarantineCount,
      pct: ((quarantineCount / total) * 100).toFixed(0),
    },
  ].filter((d) => d.value > 0);

  // Severity data with order
  const severityOrder = ["NORMAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const severityCounts = history.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, {});
  const severityData = severityOrder
    .filter((s) => severityCounts[s])
    .map((s) => ({ name: s, count: severityCounts[s] }));

  // Score trend — last 20
  const scoreData = history
    .slice(0, 20)
    .reverse()
    .map((item, i) => ({
      index: i + 1,
      score: parseFloat(item.anomaly_score?.toFixed(3)),
      decision: item.decision,
    }));

  // Location data
  const locationCounts = history.reduce((acc, item) => {
    if (item.defect_location)
      acc[item.defect_location] = (acc[item.defect_location] || 0) + 1;
    return acc;
  }, {});
  const locationData = Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Inspections",
            value: total,
            sub: "Parts inspected",
            color: "text-blue-400",
            border: "border-blue-500/30",
            icon: "🔍",
          },
          {
            label: "Pass Rate",
            value: `${passRate}%`,
            sub: `${passCount} of ${total} passed`,
            color: "text-green-400",
            border: "border-green-500/30",
            icon: "✅",
          },
          {
            label: "Defective Parts",
            value: defective,
            sub: `${((defective / total) * 100).toFixed(1)}% defect rate`,
            color: "text-red-400",
            border: "border-red-500/30",
            icon: "⚠️",
          },
          {
            label: "Avg Anomaly Score",
            value: avgScore,
            sub: "Threshold: 0.75",
            color:
              parseFloat(avgScore) >= 0.75 ? "text-red-400" : "text-green-400",
            border: "border-yellow-500/30",
            icon: "📈",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-slate-800 rounded-xl p-5 border ${card.border}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">{card.label}</span>
              <span className="text-lg">{card.icon}</span>
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Distribution */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Quality Decision Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Final AI verdict per inspection — PASS means part meets quality
              standards
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={decisionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {decisionData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name] || "#64748b"}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: COLORS[value], fontSize: 11 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Decision legend below */}
          <div className="flex justify-center gap-4 mt-2">
            {decisionData.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[d.name] }}
                ></div>
                <span className="text-xs text-slate-400">
                  {d.name}: {d.value} ({d.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Defect Severity Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              How severe are detected anomalies — CRITICAL parts are quarantined
              immediately
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={severityData}
              margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Count",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [value, "Inspections"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {severityData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name] || "#3b82f6"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Score Trend */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Anomaly Score Trend
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Score per inspection over time — above 0.75 red line = defective
              part detected
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={scoreData}
              margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="index"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                label={{
                  value: "Inspection Number",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={[0, 1.2]}
                label={{
                  value: "Score",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
              <Tooltip content={<ScoreTooltip />} />
              {/* Decision threshold line */}
              <ReferenceLine
                y={0.75}
                stroke="#ef4444"
                strokeDasharray="6 3"
                label={{
                  value: "Threshold 0.75",
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 9,
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = payload.score >= 0.75 ? "#ef4444" : "#22c55e";
                  return (
                    <circle
                      key={payload.index}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={color}
                      stroke="none"
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-400">
                Normal (below threshold)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-400">
                Defective (above threshold)
              </span>
            </div>
          </div>
        </div>

        {/* Defect Location Frequency */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Defect Location Heatmap
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Most frequent defect locations — helps identify systematic
              production issues
            </p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={locationData}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                label={{
                  value: "Occurrences",
                  position: "insideBottom",
                  offset: -2,
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                width={90}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [value, "Defects found"]}
              />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                maxBarSize={24}
              >
                {locationData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(${210 - i * 15}, 80%, ${60 - i * 5}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Recurring locations suggest camera angle or process calibration
            issues
          </p>
        </div>
      </div>
    </div>
  );
}
