import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCategory } from "../../store/inspectionSlice";

export default function ConfigPanel() {
  const dispatch = useDispatch();
  const { category } = useSelector((s) => s.inspection);

  const [thresholds, setThresholds] = useState({
    low: 0.75,
    medium: 0.85,
    high: 0.92,
    critical: 0.97,
  });

  const categories = [
    {
      id: "metal_nut",
      name: "Metal Nut",
      industry: "Automotive / Industrial",
      description: "Detects scratches, bends, color defects, flips",
      icon: "⚙️",
    },
    {
      id: "transistor",
      name: "Transistor",
      industry: "Electronics Manufacturing",
      description: "Detects bent leads, cut leads, damaged cases, misplacement",
      icon: "🔌",
    },
    {
      id: "leather",
      name: "Leather",
      industry: "Automotive / Luxury Goods",
      description: "Detects cuts, folds, glue contamination, poke marks",
      icon: "🧴",
    },
  ];

  const systemInfo = [
    {
      label: "CV Model",
      value: "PatchCore — WideResNet50",
      color: "text-blue-400",
    },
    { label: "LLM", value: "Groq — Llama 3.1 8B", color: "text-purple-400" },
    { label: "Agent Framework", value: "LangGraph", color: "text-green-400" },
    {
      label: "Memory",
      value: "ChromaDB Vector Database",
      color: "text-yellow-400",
    },
    {
      label: "Dataset",
      value: "MVTec AD (CC BY-NC-SA 4.0)",
      color: "text-slate-300",
    },
    { label: "Backend", value: "FastAPI + Uvicorn", color: "text-slate-300" },
  ];

  const thresholdColors = {
    low: "accent-green-500",
    medium: "accent-yellow-500",
    high: "accent-orange-500",
    critical: "accent-red-500",
  };

  const thresholdLabels = {
    low: { label: "PASS Threshold", desc: "Below this → NORMAL" },
    medium: { label: "LOW → MEDIUM", desc: "Rework consideration" },
    high: { label: "MEDIUM → HIGH", desc: "Rework required" },
    critical: { label: "HIGH → CRITICAL", desc: "Quarantine required" },
  };

  return (
    <div className="space-y-6">
      {/* Row 1 — Category + System Info side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Selection */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-1">
            Product Category
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Select the product type for this production line.
          </p>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => dispatch(setCategory(cat.id))}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  category === cat.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-600 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {cat.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {cat.industry}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {cat.description}
                      </div>
                    </div>
                  </div>
                  {category === cat.id && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Information */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            System Information
          </h3>
          <div className="space-y-3">
            {systemInfo.map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center py-2 border-b border-slate-700/50"
              >
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className={`text-xs font-medium ${item.color}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Stack badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Python 3.11",
              "PyTorch",
              "FastAPI",
              "React",
              "Docker",
              "HF Spaces",
            ].map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 — Decision Thresholds full width */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Decision Thresholds
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Calibrated empirically on MVTec AD samples. Good leather: ~0.58,
              defective: ~1.00.
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
            Threshold = 0.75
          </span>
        </div>

        {/* Horizontal threshold sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(thresholds).map(([key, value]) => (
            <div key={key} className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-xs font-semibold text-white uppercase">
                    {key}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {thresholdLabels[key].desc}
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-400 font-mono">
                  {value}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    [key]: parseFloat(e.target.value),
                  })
                }
                className={`w-full ${thresholdColors[key]}`}
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>0.0</span>
                <span>0.5</span>
                <span>1.0</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary bar */}
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-green-400 font-semibold">PASS</span>
            <span className="text-slate-500">score &lt; {thresholds.low}</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-blue-400 font-semibold">LOW</span>
            <span className="text-slate-500">&lt; {thresholds.medium}</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-yellow-400 font-semibold">MEDIUM</span>
            <span className="text-slate-500">&lt; {thresholds.high}</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-orange-400 font-semibold">HIGH</span>
            <span className="text-slate-500">&lt; {thresholds.critical}</span>
            <span className="text-slate-600 mx-1">→</span>
            <span className="text-red-400 font-semibold">CRITICAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
