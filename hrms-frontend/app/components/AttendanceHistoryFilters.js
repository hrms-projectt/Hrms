"use client";

// ============================================================================
// Attendance History filters - logic by Tintu, styling adapted to the HRMS theme
// (Tailwind classes instead of ../styles/AttendanceHistoryFilters.css, so it
// matches the dark / light mode of the other pages).
//
// Props:
//   records         all attendance records loaded by the page
//   departments     ["Engineering", ...]
//   onFilterChange  (filteredRecords) => void   called whenever the result changes
//
// Added on top of Tintu's version (easy to remove):
//   - search also matches the employee code
//   - status dropdown has all nine statuses of the SRS
//   - quick date buttons (Today, Last 7 days, This month, Last 30 days)
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { STATUSES, toISODate, addDays } from "@/services/attendanceService";

// ---------- Tintu's helper functions ----------
function getEmployeeName(record) {
  return record?.employeeName ?? record?.employee?.name ?? record?.name ?? "";
}

function getEmployeeCode(record) {
  return record?.employeeCode ?? record?.employee?.employeeCode ?? "";
}

function getDepartment(record) {
  return record?.departmentName ?? record?.department?.name ?? record?.department ?? "";
}

function getStatus(record) {
  return String(record?.status ?? "").trim().toUpperCase();
}

function getAttendanceDate(record) {
  const value =
    record?.attendanceDate ?? record?.date ?? record?.checkInTime ?? record?.clockInTime ?? null;

  if (!value) return "";

  // Date-only values should remain in their original calendar date.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeStatus(status) {
  const value = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (["PRESENT", "ON_TIME", "ON_TIME_PRESENT"].includes(value)) return "PRESENT";
  if (value === "LATE") return "LATE";
  if (value === "ABSENT") return "ABSENT";
  return value;
}

// ---------- the filtering itself (Tintu's logic, kept in one function) ----------
export function filterAttendanceRecords(records, { search, startDate, endDate, department, status }) {
  const query = search.trim().toLowerCase();

  return records.filter((record) => {
    const employeeName = getEmployeeName(record).toLowerCase();
    const employeeCode = String(getEmployeeCode(record)).toLowerCase();
    const recordDepartment = String(getDepartment(record)).trim();
    const recordStatus = normalizeStatus(getStatus(record));
    const attendanceDate = getAttendanceDate(record);

    const matchesSearch = !query || employeeName.includes(query) || employeeCode.includes(query);
    const matchesDepartment = department === "ALL" || recordDepartment === department;
    const matchesStatus = status === "ALL" || recordStatus === status;
    const matchesStartDate = !startDate || (attendanceDate && attendanceDate >= startDate);
    const matchesEndDate = !endDate || (attendanceDate && attendanceDate <= endDate);

    return matchesSearch && matchesDepartment && matchesStatus && matchesStartDate && matchesEndDate;
  });
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500";

export default function AttendanceHistoryFilters({
  records = [],
  departments = [],
  onFilterChange,
}) {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const departmentOptions = useMemo(() => {
    const suppliedDepartments = departments
      .map((item) => (typeof item === "string" ? item : item?.name))
      .filter(Boolean);

    const recordDepartments = records
      .map(getDepartment)
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim());

    return [...new Set([...suppliedDepartments, ...recordDepartments])].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [departments, records]);

  const invalidDateRange = Boolean(startDate && endDate && startDate > endDate);

  const filteredRecords = useMemo(
    () => filterAttendanceRecords(records, { search, startDate, endDate, department, status }),
    [records, search, startDate, endDate, department, status]
  );

  // tell the page about the result
  useEffect(() => {
    onFilterChange?.(filteredRecords);
  }, [filteredRecords, onFilterChange]);

  function resetFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setDepartment("ALL");
    setStatus("ALL");
  }

  // quick date buttons
  const today = new Date();
  const todayISO = toISODate(today);
  const presets = [
    { label: "Today", from: todayISO },
    { label: "Last 7 days", from: toISODate(addDays(today, -6)) },
    { label: "This month", from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)) },
    { label: "Last 30 days", from: toISODate(addDays(today, -29)) },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-100">Filters</h2>
          <p className="text-sm text-slate-400">Search and filter employee attendance records.</p>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-2 rounded-full bg-slate-700/40 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700/70"
        >
          <RotateCcw size={15} />
          Reset filters
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="attendance-search" className="mb-1.5 block text-xs text-slate-400">
          Search employee
        </label>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="attendance-search"
            type="search"
            placeholder="Enter employee name or code..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="attendance-start-date" className="mb-1.5 block text-xs text-slate-400">
            From date
          </label>
          <input
            id="attendance-start-date"
            type="date"
            value={startDate}
            max={endDate || todayISO}
            onChange={(event) => setStartDate(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="attendance-end-date" className="mb-1.5 block text-xs text-slate-400">
            To date
          </label>
          <input
            id="attendance-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            max={todayISO}
            onChange={(event) => setEndDate(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="attendance-department" className="mb-1.5 block text-xs text-slate-400">
            Department
          </label>
          <select
            id="attendance-department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className={inputClass}
          >
            <option value="ALL" className="bg-slate-900">All departments</option>
            {departmentOptions.map((item) => (
              <option key={item} value={item} className="bg-slate-900">
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="attendance-status" className="mb-1.5 block text-xs text-slate-400">
            Attendance status
          </label>
          <select
            id="attendance-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={inputClass}
          >
            <option value="ALL" className="bg-slate-900">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key} className="bg-slate-900">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* quick date buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = startDate === p.from && endDate === todayISO;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setStartDate(p.from);
                setEndDate(todayISO);
              }}
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

      {invalidDateRange && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          The start date cannot be later than the end date.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400" aria-live="polite">
        <span className="h-2 w-2 rounded-full bg-sky-400" />
        <span>
          Showing{" "}
          <strong className="text-slate-100">{invalidDateRange ? 0 : filteredRecords.length}</strong>{" "}
          of <strong className="text-slate-100">{records.length}</strong> attendance records
        </span>
      </div>
    </section>
  );
}
