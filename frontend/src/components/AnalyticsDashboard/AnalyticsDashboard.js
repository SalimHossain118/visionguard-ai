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

export default function AnalyticsDashboard() {
  const { history } = useSelector((s) => s.inspection);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600">
        <div className="text-5xl mb-3">📊</div>
        <p className="text-sm">Run some inspections to see analytics</p>
      </div>
    );
  }

  // Decision distribution
  const decisionCounts = history.reduce((acc, item) => {
    acc[item.decision] = (acc[item.decision] || 0) + 1;
    return acc;
  }, {});
  const decisionData = Object.entries(decisionCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Severity distribution
  const severityCounts = history.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, {});
  const severityData = Object.entries(severityCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Anomaly score over time
  const scoreData = history
    .slice(0, 20)
    .reverse()
    .map((item, i) => ({
      index: i + 1,
      score: parseFloat(item.anomaly_score?.toFixed(3)),
      coverage: parseFloat(item.coverage_percent?.toFixed(1)),
    }));

  // Defect location distribution
  const locationCounts = history.reduce((acc, item) => {
    if (item.defect_location) {
      acc[item.defect_location] = (acc[item.defect_location] || 0) + 1;
    }
    return acc;
  }, {});
  const locationData = Object.entries(locationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Summary stats
  const total = history.length;
  const passRate = (((decisionCounts["PASS"] || 0) / total) * 100).toFixed(1);
  const avgScore = (
    history.reduce((sum, i) => sum + (i.anomaly_score || 0), 0) / total
  ).toFixed(3);
  const defective = history.filter((i) => i.is_defective).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Inspections",
            value: total,
            color: "text-blue-400",
            bg: "border-blue-500/30",
          },
          {
            label: "Pass Rate",
            value: `${passRate}%`,
            color: "text-green-400",
            bg: "border-green-500/30",
          },
          {
            label: "Defective Parts",
            value: defective,
            color: "text-red-400",
            bg: "border-red-500/30",
          },
          {
            label: "Avg Anomaly Score",
            value: avgScore,
            color: "text-yellow-400",
            bg: "border-yellow-500/30",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-slate-800 rounded-xl p-5 border ${card.bg}`}
          >
            <div className="text-xs text-slate-400 mb-1">{card.label}</div>
            <div className={`text-3xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Pie Chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            Decision Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={decisionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {decisionData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name] || "#64748b"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Bar Chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            Severity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
        {/* Anomaly Score Line Chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            Anomaly Score Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="index"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                label={{
                  value: "Inspection #",
                  position: "insideBottom",
                  fill: "#64748b",
                  fontSize: 10,
                }}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 1]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Defect Location Bar Chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            Defect Location Frequency
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={locationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
