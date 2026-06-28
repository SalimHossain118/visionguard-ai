import React, { useState, useEffect } from "react";

const BASE_URL = process.env.REACT_APP_API_URL || "";

const CATEGORIES = [
  {
    id: "metal_nut",
    name: "Metal Nut",
    industry: "Automotive / Industrial",
    description:
      "Trained on MVTec AD metal nut images. Good images will show PASS, defective images show REWORK or QUARANTINE.",
  },
  {
    id: "transistor",
    name: "Transistor",
    industry: "Electronics Manufacturing",
    description:
      "Trained on MVTec AD transistor images. Detects bent leads, damaged cases, and misplacement.",
  },
  {
    id: "leather",
    name: "Leather",
    industry: "Automotive / Luxury Goods",
    description:
      "Trained on MVTec AD leather images. Detects cuts, folds, glue contamination, and poke marks.",
  },
];

export default function SampleModal({ onClose, onSelectImage }) {
  const [activeTab, setActiveTab] = useState("metal_nut");
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    CATEGORIES.forEach((cat) => {
      setLoading((prev) => ({ ...prev, [cat.id]: true }));
      fetch(`${BASE_URL}/api/v1/samples/${cat.id}`)
        .then((r) => r.json())
        .then((data) => {
          setImages((prev) => ({ ...prev, [cat.id]: data.images || [] }));
          setLoading((prev) => ({ ...prev, [cat.id]: false }));
        })
        .catch(() => {
          setImages((prev) => ({ ...prev, [cat.id]: [] }));
          setLoading((prev) => ({ ...prev, [cat.id]: false }));
        });
    });
  }, []);

  const handleSelectImage = async (category, filename) => {
    const url = `${BASE_URL}/api/v1/samples/${category}/${filename}`;
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: "image/png" });

    // Pass category as third argument — App.js forwards it to InspectionFeed
    onSelectImage(file, url, category);
    onClose();
  };

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">Sample Test Images</h2>
            <p className="text-xs text-slate-400 mt-1">
              These images are from the MVTec AD industrial benchmark dataset.
              Select any image to run an automatic inspection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700"
          >
            ×
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-700 px-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === cat.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Category Description */}
        {activeCategory && (
          <div className="px-6 py-3 bg-slate-700/30 border-b border-slate-700">
            <p className="text-xs text-slate-400">
              <span className="text-slate-300 font-medium">
                {activeCategory.industry}
              </span>
              {" — "}
              {activeCategory.description}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              💡 In a real factory, the camera captures images of the actual
              product on the production line. These sample images simulate that
              input for demo purposes.
            </p>
          </div>
        )}

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading[activeTab] ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : images[activeTab]?.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500">
              <p className="text-sm">No sample images available</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {images[activeTab]?.map((filename) => (
                <div
                  key={filename}
                  onClick={() => handleSelectImage(activeTab, filename)}
                  className="cursor-pointer rounded-lg overflow-hidden border border-slate-600 hover:border-blue-500 transition-all hover:scale-105 group"
                >
                  <div className="aspect-square bg-slate-700 relative">
                    <img
                      src={`${BASE_URL}/api/v1/samples/${activeTab}/${filename}`}
                      alt={filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 transition-all flex items-center justify-center">
                      <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 bg-blue-500 px-2 py-1 rounded">
                        Inspect
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5 bg-slate-800">
                    <p className="text-xs text-slate-400 truncate">
                      {filename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Dataset: MVTec AD — CC BY-NC-SA 4.0 License (Research use only)
          </p>
          <a
            href="https://drive.google.com/drive/folders/your-folder-id"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {"More images →"}
          </a>
        </div>
      </div>
    </div>
  );
}
