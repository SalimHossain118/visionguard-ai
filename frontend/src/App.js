import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setHistory } from "./store/inspectionSlice";
import { getHistory } from "./services/api";
import InspectionFeed from "./components/InspectionFeed/InspectionFeed";
import ReportPanel from "./components/ReportPanel/ReportPanel";
import AnalyticsDashboard from "./components/AnalyticsDashboard/AnalyticsDashboard";
import HistoryTable from "./components/HistoryTable/HistoryTable";
import ConfigPanel from "./components/ConfigPanel/ConfigPanel";
import SampleModal from "./components/SampleModal/SampleModal";

const tabs = [
  { id: "inspect", label: "Live Inspection" },
  { id: "report", label: "Report" },
  { id: "analytics", label: "Analytics" },
  { id: "history", label: "History" },
  { id: "config", label: "Configuration" },
];

export default function App() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("inspect");
  const [showSamples, setShowSamples] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [preloadedCategory, setPreloadedCategory] = useState(null);

  useEffect(() => {
    getHistory()
      .then((data) => {
        if (data.inspections && data.inspections.length > 0) {
          dispatch(setHistory(data.inspections));
        }
      })
      .catch((err) => console.warn("Could not load history:", err));
  }, [dispatch]);

  const handleSampleSelect = (file, url, category) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setPreloadedCategory(category);
    setActiveTab("inspect");
  };

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSamples(true)}
              className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
            >
              Sample Images
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">System Online</span>
            </div>
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
        {activeTab === "inspect" && (
          <InspectionFeed
            preloadedFile={selectedFile}
            preloadedUrl={previewUrl}
            preloadedCategory={preloadedCategory}
            onPreloadConsumed={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setPreloadedCategory(null);
            }}
            onOpenSamples={() => setShowSamples(true)}
          />
        )}
        {activeTab === "report" && <ReportPanel />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "history" && <HistoryTable />}
        {activeTab === "config" && <ConfigPanel />}
      </main>

      {/* Sample Images Modal */}
      {showSamples && (
        <SampleModal
          onClose={() => setShowSamples(false)}
          onSelectImage={handleSampleSelect}
        />
      )}
    </div>
  );
}
