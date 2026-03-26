/**
 * CSV Generator Utility
 *
 * Converts arrays of objects to properly escaped CSV strings
 * with support for custom column headers and timezone-aware date formatting.
 */

import { STATION_TIMEZONE } from "@/lib/timezone";

/**
 * Column definition for CSV export
 */
export interface CsvColumn<T = Record<string, unknown>> {
  /** Header text shown in the CSV */
  header: string;
  /** Key on the data object, or a function to extract the value */
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined);
}

/**
 * Escape a value for safe CSV inclusion.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format a Date or ISO string in the station timezone for CSV output.
 */
export function formatDateForExport(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    timeZone: STATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format a Date as YYYY-MM-DD in station timezone.
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", {
    timeZone: STATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Convert an array of objects to a CSV string.
 *
 * @param data - Array of row objects
 * @param columns - Column definitions with headers and accessors
 * @returns CSV string with headers and data rows
 */
export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[]
): string {
  // Header row
  const headerRow = columns.map((col) => escapeCsvValue(col.header)).join(",");

  // Data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        let value: unknown;
        if (typeof col.accessor === "function") {
          value = col.accessor(row);
        } else {
          value = row[col.accessor];
        }
        return escapeCsvValue(value);
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Format a currency value for CSV.
 */
export function formatCurrencyForExport(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  return `$${amount.toFixed(2)}`;
}
