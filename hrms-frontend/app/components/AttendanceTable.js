"use client";

// The main Attendance History table  (Srilekha's component)
//
// Props:
//   records   array of attendance records (already filtered by the page)
//   loading   true while the data is being fetched
//
// Columns: Employee Name, Date, Check-in, Check-out, Status, Working Hours
// "Late" rows are highlighted in orange.

import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  STATUSES,
  SOURCES,
  formatTime12,
  formatMinutes,
  formatDate,
} from "@/services/attendanceService";

const SORTERS = {
  date: (a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName),
  name: (a, b) => a.employeeName.localeCompare(b.employeeName) || a.date.localeCompare(b.date),
  hours: (a, b) => (a.workingMinutes ?? -1) - (b.workingMinutes ?? -1),
};

const statusInfo = (key) =>
  STATUSES.find((s) => s.key === key) || {
    label: key ? key.replace(/_/g, " ") : "Unknown",
    badge: "bg-slate-700/40 text-slate-300",
  };

// protect against spreadsheet formulas (a cell starting with = + - @)
const csvCell = (value) => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const exportCsv = (records) => {
  const header = ["Employee", "Code", "Department", "Date", "Check-in", "Check-out", "Status", "Working hours", "Source"];
  const rows = records.map((r) => [
    r.employeeName,
    r.employeeCode,
    r.department,
    r.date,
    r.checkIn,
    r.checkOut,
    statusInfo(r.status).label,
    r.workingMinutes === null ? "" : formatMinutes(r.workingMinutes),
    SOURCES[r.source] || r.source,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

function SortHeader({ label, sortKey, active, dir, onClick, className = "" }) {
  return (
    <th className={`px-5 py-3 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`flex items-center gap-1 uppercase tracking-wide transition hover:text-slate-300 ${
          active ? "text-sky-400" : ""
        }`}
      >
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
        ) : (
          <ChevronDown size={13} className="opacity-30" />
        )}
      </button>
    </th>
  );
}

export default function AttendanceTable({ records, loading }) {
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  };

  const sorted = [...records].sort((a, b) =>
    sortDir === "asc" ? SORTERS[sortKey](a, b) : SORTERS[sortKey](b, a)
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages); // never past the last page
  const start = (current - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <h2 className="font-semibold text-slate-100">
          Attendance records{" "}
          <span className="text-sm font-normal text-slate-500">
            ({loading ? "..." : sorted.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => exportCsv(sorted)}
          disabled={loading || sorted.length === 0}
          className="flex items-center gap-2 rounded-full bg-slate-700/40 px-4 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <SortHeader label="Employee" sortKey="name" active={sortKey === "name"} dir={sortDir} onClick={toggleSort} />
              <SortHeader label="Date" sortKey="date" active={sortKey === "date"} dir={sortDir} onClick={toggleSort} />
              <th className="px-5 py-3 font-medium uppercase tracking-wide">Check-in</th>
              <th className="px-5 py-3 font-medium uppercase tracking-wide">Check-out</th>
              <th className="px-5 py-3 font-medium uppercase tracking-wide">Status</th>
              <SortHeader label="Working hours" sortKey="hours" active={sortKey === "hours"} dir={sortDir} onClick={toggleSort} />
            </tr>
          </thead>

          <tbody>
            {/* loading placeholders */}
            {loading &&
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-t border-white/10">
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-8 w-full animate-pulse rounded-lg bg-white/10" />
                  </td>
                </tr>
              ))}

            {!loading &&
              rows.map((r) => {
                const info = statusInfo(r.status);
                const late = r.status === "LATE";
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-white/10 transition ${
                      late ? "bg-orange-500/10 hover:bg-orange-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    {/* employee (orange bar on the left for late entries) */}
                    <td
                      className={`px-5 py-3.5 ${
                        late ? "shadow-[inset_4px_0_0_0_#fb923c]" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border-2 border-[#2a8fd0] p-0.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-sky-300">
                            {r.employeeName.charAt(0)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">{r.employeeName}</p>
                          <p className="truncate text-xs text-slate-500">
                            {[r.employeeCode, r.department].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-300">
                      {formatDate(r.date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-300">
                      {r.checkIn ? formatTime12(r.checkIn) : <span className="text-slate-600">-</span>}
                      {r.source && (
                        <p className="text-[11px] text-slate-500">{SOURCES[r.source] || r.source}</p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-300">
                      {r.checkOut ? (
                        formatTime12(r.checkOut)
                      ) : r.checkIn ? (
                        <span className="text-xs text-sky-400">Working</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${info.badge}`}
                      >
                        {info.label}
                      </span>
                      {late && r.lateMinutes > 0 && (
                        <p className="mt-1 text-[11px] text-orange-400">{r.lateMinutes} min late</p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-200">
                      {formatMinutes(r.workingMinutes)}
                    </td>
                  </tr>
                );
              })}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-500">
                  No attendance records match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {!loading && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-xs text-slate-400">
          <span>
            Showing {start + 1}-{Math.min(start + pageSize, sorted.length)} of {sorted.length}
          </span>

          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 outline-none"
              aria-label="Rows per page"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n} className="bg-slate-900">
                  {n} per page
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/40 transition hover:bg-slate-700/70 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page {current} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/40 transition hover:bg-slate-700/70 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
