import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCategory } from "../../store/inspectionSlice";

export default function ConfigPanel() {
  const dispatch = useDispatch();
  const { category } = useSelector((s) => s.inspection);

  const [thresholds, setThresholds] = useState({
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    critical: 0.85,
  });

  const categories = [
    {
      id: "metal_nut",
      name: "Metal Nut",
      industry: "Automotive / Industrial",
      description: "Detects scratches, bends, color defects, flips",
    },
    {
      id: "transistor",
      name: "Transistor",
      industry: "Electronics Manufacturing",
      description: "Detects bent leads, cut leads, damaged cases, misplacement",
    },
    {
      id: "leather",
      name: "Leather",
      industry: "Automotive / Luxury Goods",
      description: "Detects cuts, folds, glue contamination, poke marks",
    },
  ];

  const systemInfo = [
    { label: "CV Model", value: "PatchCore — WideResNet50" },
    { label: "LLM", value: "Groq — Llama 3.1 8B" },
    { label: "Memory", value: "ChromaDB Vector Database" },
    { label: "Agent Framework", value: "LangGraph" },
    { label: "Dataset", value: "MVTec AD (CC BY-NC-SA 4.0)" },
    { label: "Backend", value: "FastAPI + Uvicorn" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Category Selection */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-1">
          Product Category
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Select the product type being inspected on this production line.
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
                {category === cat.id && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Thresholds */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-1">
          Decision Thresholds
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Anomaly score thresholds for severity classification.
        </p>
        <div className="space-y-4">
          {Object.entries(thresholds).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-slate-300 uppercase">
                  {key}
                </span>
                <span className="text-xs text-blue-400 font-mono">{value}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={value}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    [key]: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg text-xs text-slate-400">
          Score &lt; {thresholds.low} → NORMAL &nbsp;|&nbsp;
          {thresholds.low}–{thresholds.medium} → LOW &nbsp;|&nbsp;
          {thresholds.medium}–{thresholds.high} → MEDIUM &nbsp;|&nbsp;
          {thresholds.high}–{thresholds.critical} → HIGH &nbsp;|&nbsp; &gt;{" "}
          {thresholds.critical} → CRITICAL
        </div>
      </div>

      {/* System Info */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4">
          System Information
        </h3>
        <div className="space-y-2">
          {systemInfo.map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center py-2 border-b border-slate-700/50"
            >
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className="text-xs font-medium text-slate-200">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
