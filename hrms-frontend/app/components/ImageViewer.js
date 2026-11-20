"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw, RotateCcw } from "lucide-react";

// Download a file. Tries a normal download first; if the browser blocks it
// (different website), it opens the file in a new tab instead.
export const downloadFile = async (url, fileName = "document") => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("download failed");
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank", "noopener");
  }
};

// Image preview with zoom and rotate buttons
export default function ImageViewer({ src, alt }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/40 text-slate-300 transition hover:bg-slate-700/70";

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2">
        <span className="mr-1 text-xs text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className={btn}
          title="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          className={btn}
          title="Zoom in"
          onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          className={btn}
          title="Rotate left"
          onClick={() => setRotation((r) => r - 90)}
        >
          <RotateCcw size={15} />
        </button>
        <button
          type="button"
          className={btn}
          title="Rotate right"
          onClick={() => setRotation((r) => r + 90)}
        >
          <RotateCw size={15} />
        </button>
        <button
          type="button"
          className="rounded-full bg-slate-700/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/70"
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
        >
          Reset
        </button>
      </div>

      <div className="flex min-h-[360px] items-center justify-center overflow-auto rounded-xl bg-black/30 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{
            transform: `rotate(${rotation}deg) scale(${zoom})`,
            transition: "transform 0.2s ease",
          }}
          className="max-h-[520px] w-auto max-w-full rounded-lg object-contain"
        />
      </div>
    </div>
  );
}
