"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "./Alert.jsx";
import { getTeamAttendance, getTeamLeaves } from "../../../services/tintu/teamCalendarService.js";
import {
  MONTH_NAMES,
  WEEKDAYS,
  buildDayMap,
  buildMonthGrid,
  dayTone,
  getMonthRange,
  toISO,
} from "../../../services/tintu/utils/calendarHelpers.js";
import { callApi } from "../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../services/tintu/utils/getErrorMessage.js";

const toneStyles = {
  absent: "border-red-500/30 bg-red-500/10",
  leave: "border-sky-500/30 bg-sky-500/10",
  present: "border-green-500/30 bg-green-500/10",
  none: "border-white/10 bg-[#111833]",
};

function Legend() {
  const item = (color, label) => (
    <span className="flex items-center gap-2 text-sm text-slate-300">
      <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
      {label}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-4">
      {item("bg-green-500/100", "Present")}
      {item("bg-red-500/100", "Absent")}
      {item("bg-sky-500/100", "On Leave")}
    </div>
  );
}

function NameList({ title, color, people }) {
  if (!people.length) return null;
  return (
    <div className="mt-2">
      <p className={`text-xs font-semibold uppercase ${color}`}>
        {title} ({people.length})
      </p>
      <ul className="mt-1 space-y-0.5 text-sm text-slate-300">
        {people.map((p, i) => (
          <li key={`${p.name}-${i}`}>
            {p.name}
            {p.detail ? <span className="text-slate-400"> · {p.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TeamCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // current month by default

  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // "yyyy-mm-dd"

  const loadMonth = useCallback(async () => {
    const { from, to } = getMonthRange(year, month);
    setLoading(true);
    setError("");

    const [att, lv] = await Promise.all([
      callApi(() => getTeamAttendance(from, to)),
      callApi(() => getTeamLeaves(from, to)),
    ]);
    setLoading(false);

    const failed = [att, lv].find((r) => !r.ok);
    if (failed) {
      setAttendance([]);
      setLeaves([]);
      if (failed.status === 401 || failed.status === 403) {
        setError("Access denied. Only managers can view the team calendar.");
      } else {
        setError(getErrorMessage(failed));
      }
      return;
    }
    setAttendance(att.data);
    setLeaves(lv.data);
  }, [year, month]);

  useEffect(() => {
    setSelected(null);
    loadMonth();
  }, [loadMonth]);

  const dayMap = useMemo(
    () => buildDayMap(attendance, leaves, year, month),
    [attendance, leaves, year, month]
  );
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const hasData = Object.keys(dayMap).length > 0;

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const selectedInfo = selected ? dayMap[selected] : null;

  return (
    <div className="rounded-2xl bg-[#111833] p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-100">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button onClick={goPrev}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-white/10">
            ← Prev
          </button>
          <button onClick={goToday}
            className="rounded-lg bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 hover:bg-sky-500/15">
            Today
          </button>
          <button onClick={goNext}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-white/10">
            Next →
          </button>
        </div>
      </div>

      <Legend />

      <div className="mt-4">
        <Alert type="error" message={error} />
        {error && (
          <button onClick={loadMonth}
            className="mb-4 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-white/10">
            Try again
          </button>
        )}
        {loading && <p className="mb-2 text-sm text-slate-400">Loading team data...</p>}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-400">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, index) => {
              if (!cell) return <div key={`blank-${index}`} />;

              const info = dayMap[cell.key];
              const tone = dayTone(info);
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selected;
              const col = index % 7;
              const tooltipSide = col >= 4 ? "right-0" : "left-0";
              const hasTooltip = info && (info.leave.length > 0 || info.absent.length > 0);

              return (
                <div key={cell.key} className="group relative">
                  <button
                    type="button"
                    onClick={() => setSelected(cell.key)}
                    className={`flex h-24 w-full flex-col items-start justify-between rounded-lg border p-2 text-left transition hover:shadow-md ${toneStyles[tone]} ${
                      isToday ? "ring-2 ring-blue-600" : ""
                    } ${isSelected ? "outline outline-2 outline-gray-800" : ""}`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        cell.weekday === 0 || cell.weekday === 6
                          ? "text-slate-400"
                          : "text-slate-100"
                      }`}
                    >
                      {cell.day}
                    </span>

                    {info && (
                      <span className="flex flex-wrap gap-x-2 text-xs font-medium">
                        {info.present.length > 0 && (
                          <span className="text-green-300">● {info.present.length}</span>
                        )}
                        {info.absent.length > 0 && (
                          <span className="text-red-300">● {info.absent.length}</span>
                        )}
                        {info.leave.length > 0 && (
                          <span className="text-sky-300">● {info.leave.length}</span>
                        )}
                      </span>
                    )}
                  </button>

                  {/* Hover / keyboard-focus tooltip */}
                  {hasTooltip && (
                    <div
                      className={`pointer-events-none absolute top-full z-30 mt-1 hidden w-56 rounded-lg border border-white/10 bg-[#111833] p-3 text-left shadow-lg group-hover:block group-focus-within:block ${tooltipSide}`}
                    >
                      <p className="text-xs font-semibold text-slate-400">{cell.key}</p>
                      <NameList title="On Leave" color="text-sky-300" people={info.leave} />
                      <NameList title="Absent" color="text-red-300" people={info.absent} />
                      {info.present.length > 0 && (
                        <p className="mt-2 text-xs text-slate-400">
                          {info.present.length} present
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!loading && !error && !hasData && (
        <p className="mt-4 text-center text-sm text-slate-400">
          No attendance or leave records for this month.
        </p>
      )}

      {/* Selected-day details (also works on phones where hover is not possible) */}
      {selected && (
        <div className="mt-5 rounded-xl border border-white/10 bg-[#0f1a2e] p-4">
          <p className="font-semibold text-slate-100">{selected}</p>
          {selectedInfo ? (
            <>
              <NameList title="On Leave" color="text-sky-300" people={selectedInfo.leave} />
              <NameList title="Absent" color="text-red-300" people={selectedInfo.absent} />
              <NameList title="Present" color="text-green-300" people={selectedInfo.present} />
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No records for this day.</p>
          )}
        </div>
      )}
    </div>
  );
}