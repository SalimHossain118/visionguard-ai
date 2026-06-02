import React, { useState } from "react";
import InspectionFeed from "./components/InspectionFeed/InspectionFeed";
import ReportPanel from "./components/ReportPanel/ReportPanel";
import AnalyticsDashboard from "./components/AnalyticsDashboard/AnalyticsDashboard";
import HistoryTable from "./components/HistoryTable/HistoryTable";
import ConfigPanel from "./components/ConfigPanel/ConfigPanel";

const tabs = [
  { id: "inspect", label: "Live Inspection" },
  { id: "report", label: "Report" },
  { id: "analytics", label: "Analytics" },
  { id: "history", label: "History" },
  { id: "config", label: "Configuration" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("inspect");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VG</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">VisionGuard AI</h1>
              <p className="text-xs text-slate-400">
                Industrial Quality Control System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">System Online</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6">
        <div className="flex max-w-7xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "inspect" && <InspectionFeed />}
        {activeTab === "report" && <ReportPanel />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "history" && <HistoryTable />}
        {activeTab === "config" && <ConfigPanel />}
      </main>
    </div>
  );
}
