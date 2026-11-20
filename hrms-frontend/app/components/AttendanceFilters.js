"use client";

// Filter / search bar for the Attendance History page  (Tintu's component)
//
// Props:
//   value        { search, from, to, department, status }   current filters
//   onChange     (newValue) => void                          called on every change
//   departments  ["Engineering", ...]                        options for the dropdown
//   onReset      () => void                                  "Reset filters" button
//   error        string                                      date range message (optional)

import { Search, X, RotateCcw, Calendar } from "lucide-react";
import { STATUSES, toISODate, addDays } from "@/services/attendanceService";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500";

export default function AttendanceFilters({ value, onChange, departments, onReset, error }) {
  const set = (patch) => onChange({ ...value, ...patch });

  const today = new Date();
  const todayISO = toISODate(today);
  const presets = [
    { label: "Today", from: todayISO, to: todayISO },
    { label: "Last 7 days", from: toISODate(addDays(today, -6)), to: todayISO },
    { label: "This month", from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), to: todayISO },
    { label: "Last 30 days", from: toISODate(addDays(today, -29)), to: todayISO },
  ];

  const statusLabel = STATUSES.find((s) => s.key === value.status)?.label;
  const hasChips = value.search || value.department || value.status;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search name or employee code"
            className={`${inputClass} pl-10`}
          />
        </div>

        {/* department */}
        <select
          value={value.department}
          onChange={(e) => set({ department: e.target.value })}
          className={inputClass}
          aria-label="Department"
        >
          <option value="" className="bg-slate-900">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d} className="bg-slate-900">{d}</option>
          ))}
        </select>

        {/* status */}
        <select
          value={value.status}
          onChange={(e) => set({ status: e.target.value })}
          className={inputClass}
          aria-label="Status"
        >
          <option value="" className="bg-slate-900">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key} className="bg-slate-900">{s.label}</option>
          ))}
        </select>

        {/* reset */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-700/40 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700/70"
        >
          <RotateCcw size={15} />
          Reset filters
        </button>
      </div>

      {/* date range */}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} /> From
          </label>
          <input
            type="date"
            value={value.from}
            max={value.to || todayISO}
            onChange={(e) => set({ from: e.target.value })}
            className={`${inputClass} w-44`}
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={12} /> To
          </label>
          <input
            type="date"
            value={value.to}
            min={value.from}
            max={todayISO}
            onChange={(e) => set({ to: e.target.value })}
            className={`${inputClass} w-44`}
          />
        </div>

        <div className="flex flex-wrap gap-2 pb-0.5">
          {presets.map((p) => {
            const active = value.from === p.from && value.to === p.to;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => set({ from: p.from, to: p.to })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-slate-700/40 text-slate-300 hover:bg-slate-700/70"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {/* active filters as removable chips */}
      {hasChips && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Active filters:</span>
          {value.search && (
            <Chip text={`Search: ${value.search}`} onRemove={() => set({ search: "" })} />
          )}
          {value.department && (
            <Chip text={value.department} onRemove={() => set({ department: "" })} />
          )}
          {value.status && (
            <Chip text={statusLabel || value.status} onRemove={() => set({ status: "" })} />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ text, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300">
      {text}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${text}`}
        className="text-sky-300/70 hover:text-sky-200"
      >
        <X size={12} />
      </button>
    </span>
  );
}
