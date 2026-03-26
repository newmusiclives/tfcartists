"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface ExportButtonsProps {
  /** Export type: artists, sponsors, listeners, earnings, playback, financials */
  type: "artists" | "sponsors" | "listeners" | "earnings" | "playback" | "financials";
  /** Optional CSS class for the container */
  className?: string;
  /** Button color theme */
  color?: "purple" | "green" | "blue" | "indigo" | "gray";
  /** Size variant */
  size?: "sm" | "md";
}

const colorMap: Record<string, { bg: string; hover: string; text: string; border: string }> = {
  purple: { bg: "bg-purple-50", hover: "hover:bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  green: { bg: "bg-green-50", hover: "hover:bg-green-100", text: "text-green-700", border: "border-green-200" },
  blue: { bg: "bg-blue-50", hover: "hover:bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  indigo: { bg: "bg-indigo-50", hover: "hover:bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  gray: { bg: "bg-gray-50", hover: "hover:bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

export function ExportButtons({ type, className = "", color = "gray", size = "sm" }: ExportButtonsProps) {
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);
  const c = colorMap[color] || colorMap.gray;

  const isSmall = size === "sm";
  const btnClass = `inline-flex items-center gap-1.5 ${isSmall ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} font-medium rounded-lg border transition-colors ${c.bg} ${c.hover} ${c.text} ${c.border}`;

  async function handleExport(format: "csv" | "pdf") {
    setDownloading(format);
    try {
      const url = `/api/exports?type=${type}&format=${format}`;

      if (format === "pdf") {
        // Open HTML report in new tab for printing
        window.open(url, "_blank");
      } else {
        // Trigger CSV file download
        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Export failed" }));
          alert(err.error?.message || err.error || "Export failed");
          return;
        }
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={() => handleExport("csv")}
        disabled={downloading !== null}
        className={btnClass}
        title={`Download ${type} as CSV`}
      >
        {downloading === "csv" ? (
          <Loader2 className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} animate-spin`} />
        ) : (
          <Download className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
        )}
        <span>CSV</span>
      </button>
      <button
        onClick={() => handleExport("pdf")}
        disabled={downloading !== null}
        className={btnClass}
        title={`Open ${type} report for printing`}
      >
        {downloading === "pdf" ? (
          <Loader2 className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} animate-spin`} />
        ) : (
          <FileText className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
        )}
        <span>PDF</span>
      </button>
    </div>
  );
}
