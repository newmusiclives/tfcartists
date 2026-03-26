/**
 * PDF Report Generator
 *
 * Generates printable HTML reports that can be saved as PDF via browser print (Ctrl+P).
 * No heavy PDF libraries required - uses clean, print-optimized HTML/CSS.
 */

import { STATION_TIMEZONE } from "@/lib/timezone";

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  stationName?: string;
  dateRange?: { from: string; to: string };
  generatedAt?: Date;
  columns: { header: string; align?: "left" | "right" | "center" }[];
  rows: (string | number)[][];
  summaryRows?: { label: string; value: string }[];
}

/**
 * Format a timestamp for the report footer.
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: STATION_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function escapeHtml(str: string | number): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate a complete HTML document optimized for printing / Save as PDF.
 */
export function generatePdfHtml(options: PdfReportOptions): string {
  const {
    title,
    subtitle,
    stationName = "TrueFans Radio",
    dateRange,
    generatedAt = new Date(),
    columns,
    rows,
    summaryRows,
  } = options;

  const dateRangeStr = dateRange
    ? `${dateRange.from} to ${dateRange.to}`
    : "All time";

  const headerRows = rows.length;

  const tableHeaders = columns
    .map(
      (col) =>
        `<th style="text-align:${col.align || "left"}">${escapeHtml(col.header)}</th>`
    )
    .join("\n            ");

  const tableRows = rows
    .map(
      (row) =>
        `          <tr>\n${row
          .map((cell, i) => {
            const align = columns[i]?.align || "left";
            return `            <td style="text-align:${align}">${escapeHtml(cell)}</td>`;
          })
          .join("\n")}\n          </tr>`
    )
    .join("\n");

  const summaryHtml = summaryRows
    ? `
      <div class="summary">
        <h3>Summary</h3>
        <table class="summary-table">
          ${summaryRows
            .map(
              (s) =>
                `<tr><td class="summary-label">${escapeHtml(s.label)}</td><td class="summary-value">${escapeHtml(s.value)}</td></tr>`
            )
            .join("\n          ")}
        </table>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - ${escapeHtml(stationName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
      padding: 0.5in;
      line-height: 1.4;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #7c3aed;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .header-left h1 {
      font-size: 20pt;
      color: #7c3aed;
      font-weight: 700;
    }

    .header-left .subtitle {
      font-size: 11pt;
      color: #666;
      margin-top: 2px;
    }

    .header-right {
      text-align: right;
      font-size: 9pt;
      color: #666;
    }

    .header-right .station-name {
      font-size: 12pt;
      font-weight: 600;
      color: #1a1a1a;
    }

    .meta {
      display: flex;
      gap: 24px;
      font-size: 9pt;
      color: #666;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
    }

    .meta span { font-weight: 600; color: #333; }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
    }

    table.data-table thead th {
      background: #f3f0ff;
      color: #5b21b6;
      font-weight: 600;
      padding: 8px 10px;
      border-bottom: 2px solid #7c3aed;
      white-space: nowrap;
    }

    table.data-table tbody td {
      padding: 6px 10px;
      border-bottom: 1px solid #e5e5e5;
    }

    table.data-table tbody tr:nth-child(even) {
      background: #fafafa;
    }

    table.data-table tbody tr:hover {
      background: #f5f0ff;
    }

    .summary {
      margin-top: 16px;
      padding: 12px 16px;
      background: #f9fafb;
      border: 1px solid #e5e5e5;
      border-radius: 6px;
    }

    .summary h3 {
      font-size: 11pt;
      color: #374151;
      margin-bottom: 8px;
    }

    .summary-table {
      width: auto;
    }

    .summary-table td {
      padding: 3px 16px 3px 0;
      font-size: 10pt;
    }

    .summary-label {
      color: #666;
    }

    .summary-value {
      font-weight: 600;
      color: #1a1a1a;
    }

    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #e5e5e5;
      font-size: 8pt;
      color: #999;
      display: flex;
      justify-content: space-between;
    }

    /* Print-specific styles */
    @media print {
      body { padding: 0; }
      .header { break-after: avoid; }
      table.data-table { page-break-inside: auto; }
      table.data-table tr { page-break-inside: avoid; }
      table.data-table thead { display: table-header-group; }
      .no-print { display: none !important; }
    }

    /* Print button (hidden in print) */
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #7c3aed;
      color: white;
      padding: 8px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      font-size: 13px;
    }

    .print-bar button {
      background: white;
      color: #7c3aed;
      border: none;
      padding: 6px 20px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }

    .print-bar button:hover { background: #f3f0ff; }

    @media print {
      .print-bar { display: none; }
      body { padding-top: 0; }
    }

    @media screen {
      body { padding-top: 52px; }
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <span>Report Preview - ${escapeHtml(title)}</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="header-left">
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
    </div>
    <div class="header-right">
      <div class="station-name">${escapeHtml(stationName)}</div>
      <div>Analytics Report</div>
    </div>
  </div>

  <div class="meta">
    <div>Date Range: <span>${escapeHtml(dateRangeStr)}</span></div>
    <div>Records: <span>${headerRows.toLocaleString()}</span></div>
    <div>Generated: <span>${escapeHtml(formatTimestamp(generatedAt))}</span></div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        ${tableHeaders}
      </tr>
    </thead>
    <tbody>
${tableRows}
    </tbody>
  </table>

  ${summaryHtml}

  <div class="footer">
    <div>${escapeHtml(stationName)} - Confidential</div>
    <div>Generated ${escapeHtml(formatTimestamp(generatedAt))} (Mountain Time)</div>
  </div>
</body>
</html>`;
}
