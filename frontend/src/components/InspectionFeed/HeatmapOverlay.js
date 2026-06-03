import React, { useEffect, useRef } from "react";

export default function HeatmapOverlay({ imageUrl, heatmap }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !heatmap) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(img, 0, 0, 224, 224);

      // Overlay heatmap
      const imageData = ctx.getImageData(0, 0, 224, 224);
      const data = imageData.data;

      for (let y = 0; y < 224; y++) {
        for (let x = 0; x < 224; x++) {
          const idx = (y * 224 + x) * 4;
          const score = heatmap[y][x];

          // Jet colormap — blue=low, red=high
          const r = Math.min(
            255,
            Math.max(0, Math.round(255 * (score > 0.5 ? 1 : score * 2))),
          );
          const g = Math.min(
            255,
            Math.max(
              0,
              Math.round(255 * (score < 0.5 ? score * 2 : 2 - score * 2)),
            ),
          );
          const b = Math.min(
            255,
            Math.max(0, Math.round(255 * (score < 0.5 ? 1 - score * 2 : 0))),
          );

          // Blend with original image
          const alpha = score * 0.6;
          data[idx] = data[idx] * (1 - alpha) + r * alpha;
          data[idx + 1] = data[idx + 1] * (1 - alpha) + g * alpha;
          data[idx + 2] = data[idx + 2] * (1 - alpha) + b * alpha;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    img.src = imageUrl;
  }, [imageUrl, heatmap]);

  return (
    <div>
      <div className="text-xs text-slate-400 mb-2">Anomaly Heatmap Overlay</div>
      <canvas
        ref={canvasRef}
        className="rounded-lg w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
