import React, { useState } from "react";
import { useSelector } from "react-redux";

export default function HistoryTable() {
  const { history } = useSelector((s) => s.inspection);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = history.filter(
    (item) =>
      item.decision?.toLowerCase().includes(search.toLowerCase()) ||
      item.severity?.toLowerCase().includes(search.toLowerCase()) ||
      item.defect_location?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()),
  );

  const decisionBadge = {
    PASS: "bg-green-500/20 text-green-400 border border-green-500/30",
    REWORK: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    QUARANTINE: "bg-red-500/20 text-red-400 border border-red-500/30",
  };

  const severityColor = {
    NORMAL: "text-green-400",
    LOW: "text-blue-400",
    MEDIUM: "text-yellow-400",
    HIGH: "text-orange-400",
    CRITICAL: "text-red-400",
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-600">
        <div className="text-5xl mb-3">🗃️</div>
        <p className="text-sm">
          No inspections yet — run some inspections first
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by decision, severity, location, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-500">
          {filtered.length} records
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900">
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                #
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                Timestamp
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                Severity
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                Location
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                Score
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                Coverage
              </th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                Decision
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr
                key={item.id}
                onClick={() =>
                  setSelected(selected?.id === item.id ? null : item)
                }
                className={`border-b border-slate-700/50 cursor-pointer transition-colors ${
                  selected?.id === item.id
                    ? "bg-blue-500/10"
                    : "hover:bg-slate-700/50"
                }`}
              >
                <td className="px-4 py-3 text-slate-500">
                  {filtered.length - index}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(item.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-300 capitalize">
                  {item.category}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${severityColor[item.severity] || "text-white"}`}
                >
                  {item.severity}
                </td>
                <td className="px-4 py-3 text-slate-300 capitalize">
                  {item.defect_location}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {item.anomaly_score?.toFixed(3)}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {item.coverage_percent}%
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${decisionBadge[item.decision]}`}
                  >
                    {item.decision}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="bg-slate-800 rounded-xl p-5 border border-blue-500/30">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-white">
              Inspection Detail
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-slate-500 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-1">
                Inspection Report
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-xs text-slate-300 leading-relaxed">
                {selected.inspection_report}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">
                Root Cause Analysis
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-xs text-slate-300 leading-relaxed">
                {selected.root_cause}
              </div>
              <div className="text-xs text-slate-400 mb-1 mt-3">
                Decision Justification
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-xs text-slate-300 leading-relaxed">
                {selected.decision_justification}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
