import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setInspectionResult,
  setError,
  setCategory,
} from "../../store/inspectionSlice";
import { inspectImage } from "../../services/api";
import HeatmapOverlay from "./HeatmapOverlay";

export default function InspectionFeed({
  preloadedFile,
  preloadedUrl,
  preloadedCategory,
  onPreloadConsumed,
  onOpenSamples,
}) {
  const dispatch = useDispatch();
  const { currentInspection, isLoading, error } = useSelector(
    (s) => s.inspection,
  );

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("metal_nut");

  useEffect(() => {
    if (preloadedFile && preloadedUrl) {
      setSelectedFile(preloadedFile);
      setPreviewUrl(preloadedUrl);
      if (preloadedCategory) {
        setSelectedCategory(preloadedCategory);
        dispatch(setCategory(preloadedCategory));
      }
      if (onPreloadConsumed) onPreloadConsumed();
    }
  }, [
    preloadedFile,
    preloadedUrl,
    preloadedCategory,
    onPreloadConsumed,
    dispatch,
  ]);

  const categories = [
    { id: "metal_nut", label: "Metal Nut", industry: "Automotive" },
    { id: "transistor", label: "Transistor", industry: "Electronics" },
    { id: "leather", label: "Leather", industry: "Luxury / Automotive" },
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    dispatch(setCategory(catId));
  };

  const handleInspect = async () => {
    if (!selectedFile) return;
    dispatch(setLoading(true));
    try {
      const result = await inspectImage(selectedFile, selectedCategory);
      dispatch(setInspectionResult(result));
    } catch (err) {
      dispatch(setError(err.message || "Inspection failed"));
    }
  };

  const decisionColor = {
    PASS: "bg-green-500",
    REWORK: "bg-yellow-500",
    QUARANTINE: "bg-red-500",
  };

  const decisionText = {
    PASS: "text-green-400",
    REWORK: "text-yellow-400",
    QUARANTINE: "text-red-400",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — Upload Panel */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Upload Image</h2>

        {/* Category Selector */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">
            Product Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedCategory === cat.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                <div className="text-xs font-semibold">{cat.label}</div>
                <div className="text-xs opacity-60">{cat.industry}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("fileInput").click()}
          className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors mb-4"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
          ) : (
            <div>
              <div className="text-4xl mb-2">📁</div>
              <p className="text-slate-400 text-sm">
                Drop image here or click to upload
              </p>
              <p className="text-slate-600 text-xs mt-2">PNG, JPG supported</p>
              <div className="mt-4 border-t border-slate-700 pt-4">
                <p className="text-slate-500 text-xs mb-2">
                  Don't have an image?
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenSamples) onOpenSamples();
                  }}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
                >
                  🖼️ Browse Sample Images
                </button>
              </div>
            </div>
          )}
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Inspect Button */}
        <button
          onClick={handleInspect}
          disabled={!selectedFile || isLoading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
            !selectedFile || isLoading
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Analyzing..." : "Run Inspection"}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Right — Results Panel */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">
          Inspection Result
        </h2>

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm">Running AI pipeline...</p>
            <p className="text-slate-600 text-xs mt-1">
              This may take 15-30 seconds
            </p>
          </div>
        )}

        {!isLoading && !currentInspection && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-sm">Upload an image to start inspection</p>
            <p className="text-xs mt-2 text-slate-700">
              Use Sample Images button for quick demo
            </p>
          </div>
        )}

        {!isLoading && currentInspection && (
          <div>
            {/* Decision Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${decisionColor[currentInspection.decision]} mb-4`}
            >
              <span className="text-white font-bold text-sm">
                {currentInspection.decision}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-xs text-slate-400">Anomaly Score</div>
                <div className="text-xl font-bold text-white">
                  {currentInspection.anomaly_score.toFixed(3)}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-xs text-slate-400">Severity</div>
                <div
                  className={`text-xl font-bold ${decisionText[currentInspection.decision] || "text-white"}`}
                >
                  {currentInspection.severity}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-xs text-slate-400">Defect Location</div>
                <div className="text-sm font-semibold text-white capitalize">
                  {currentInspection.defect_location}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-xs text-slate-400">Coverage</div>
                <div className="text-xl font-bold text-white">
                  {currentInspection.coverage_percent}%
                </div>
              </div>
            </div>

            {/* Heatmap */}
            {previewUrl && currentInspection.heatmap && (
              <HeatmapOverlay
                imageUrl={previewUrl}
                heatmap={currentInspection.heatmap}
              />
            )}

            {/* Justification */}
            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">
                Decision Justification
              </div>
              <p className="text-sm text-slate-300">
                {currentInspection.decision_justification}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
