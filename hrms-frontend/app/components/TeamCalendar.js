"use client";

// ============================================================================
// TEMPORARY STAND-IN for Tintu's  TeamCalendar  component  (task T-11).
// It follows the same contract, so the Manager Portal works today.
// When Tintu sends his real file, REPLACE THIS WHOLE FILE with his.
//
// Contract (no props, used as  <TeamCalendar />):
//   - shows the CURRENT month first, with previous / next month buttons
//   - loads the data with  getTeamCalendar("YYYY-MM")  from @/services/managerService
//   - reloads when the "approvals-changed" event fires (a leave was approved / rejected)
//   - colours: Green = Present, Red = Absent, Blue = On Leave (grey = weekly off / holiday)
//   - hovering a day lists the team members who are on leave (and absent)
//
// Each entry: { date: "YYYY-MM-DD", employeeId, employeeName, status, leaveType }
//   status: PRESENT, LATE, OVERTIME, EARLY_EXIT, HALF_DAY, ABSENT, LEAVE, WEEKLY_OFF, HOLIDAY
// ============================================================================

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import {
  getTeamCalendar,
  groupByDate,
  calendarGroup,
  CALENDAR_GROUPS,
  monthKey,
} from "@/services/managerService";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function TeamCalendar() {
  const [month, setMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1); // current month by default
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const key = monthKey(month);

  useEffect(() => {
    let active = true;
    const load = () =>
      getTeamCalendar(key)
        .then((data) => {
          if (!active) return;
          setEntries(data);
          setError("");
        })
        .catch((err) => active && setError(err.message || "Could not load the team calendar"));

    setLoading(true);
    load().finally(() => active && setLoading(false));

    const reload = () => load(); // silent reload after an approval
    window.addEventListener("approvals-changed", reload);
    return () => {
      active = false;
      window.removeEventListener("approvals-changed", reload);
    };
  }, [key]);

  const byDate = useMemo(() => groupByDate(entries), [entries]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = month.getDay(); // blank cells before day 1
  const todayISO = toISO(new Date());

  // who is on leave / absent today (only when the shown month is the current one)
  const todayEntries = byDate[todayISO] || [];
  const leaveToday = todayEntries.filter((e) => calendarGroup(e.status) === "LEAVE");
  const absentToday = todayEntries.filter((e) => calendarGroup(e.status) === "ABSENT");

  const moveMonth = (delta) => setMonth(new Date(year, monthIndex + delta, 1));
  const goToday = () => {
    const t = new Date();
    setMonth(new Date(t.getFullYear(), t.getMonth(), 1));
  };

  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Team Attendance &amp; Leave</h2>
          <p className="text-sm text-slate-400">See who is present, absent or on leave. Hover over a day for names.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700/40 transition hover:bg-slate-700/70"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[150px] text-center text-sm font-semibold text-slate-100">
            {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700/40 transition hover:bg-slate-700/70"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-full bg-sky-500/15 px-4 py-2 text-xs font-medium text-sky-300 transition hover:bg-sky-500/25"
          >
            Today
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* today strip */}
      {key === monthKey(new Date()) && !loading && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-sky-400">On leave today ({leaveToday.length})</p>
            <p className="text-slate-300">
              {leaveToday.length === 0
                ? "No one"
                : leaveToday.map((e) => `${e.employeeName}${e.leaveType ? ` (${e.leaveType})` : ""}`).join(", ")}
            </p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-400">Absent today ({absentToday.length})</p>
            <p className="text-slate-300">{absentToday.length === 0 ? "No one" : absentToday.map((e) => e.employeeName).join(", ")}</p>
          </div>
        </div>
      )}

      {/* legend */}
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-400">
        {Object.entries(CALENDAR_GROUPS).map(([k, g]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} />
            {g.label}
          </span>
        ))}
      </div>

      {/* month grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-[84px] animate-pulse rounded-xl bg-white/10" />
          ))}
        </div>
      ) : (
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {cells.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} />;

            const iso = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
            const list = byDate[iso] || [];
            const leave = list.filter((e) => calendarGroup(e.status) === "LEAVE");
            const absent = list.filter((e) => calendarGroup(e.status) === "ABSENT");
            const present = list.filter((e) => calendarGroup(e.status) === "PRESENT");
            const off = list.filter((e) => calendarGroup(e.status) === "OFF");

            // the cell colour follows the most important status of the day
            let tint = "bg-white/[0.03]";
            if (absent.length) tint = CALENDAR_GROUPS.ABSENT.tint;
            else if (leave.length) tint = CALENDAR_GROUPS.LEAVE.tint;
            else if (present.length) tint = CALENDAR_GROUPS.PRESENT.tint;
            else if (off.length) tint = CALENDAR_GROUPS.OFF.tint;

            const column = index % 7;
            const align = column <= 2 ? "left-0" : column === 3 ? "left-1/2 -translate-x-1/2" : "right-0";
            const isToday = iso === todayISO;

            return (
              <div
                key={iso}
                tabIndex={0}
                className={`group relative h-[84px] rounded-xl border border-white/10 p-2 outline-none transition focus:border-sky-500/60 ${tint} ${
                  isToday ? "ring-2 ring-sky-400/60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-sm font-medium ${isToday ? "text-sky-400" : "text-slate-200"}`}>{day}</span>
                  {off.length > 0 && list.length === off.length && (
                    <span className="text-[10px] text-slate-500">{off[0].status === "HOLIDAY" ? "Holiday" : "Off"}</span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-medium">
                  {present.length > 0 && (
                    <span className="flex items-center gap-1 text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      {present.length}
                    </span>
                  )}
                  {absent.length > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      {absent.length}
                    </span>
                  )}
                  {leave.length > 0 && (
                    <span className="flex items-center gap-1 text-sky-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      {leave.length}
                    </span>
                  )}
                </div>

                {/* hover details */}
                {list.length > 0 && (
                  <div
                    className={`pointer-events-none absolute top-full z-30 mt-1 hidden w-56 rounded-xl border border-white/10 bg-[#0b1020] p-3 text-left shadow-xl group-hover:block group-focus:block ${align}`}
                  >
                    <p className="mb-2 text-xs font-semibold text-slate-100">
                      {new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>

                    {leave.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[11px] font-medium text-sky-400">On leave ({leave.length})</p>
                        {leave.map((e) => (
                          <p key={e.employeeId} className="text-xs text-slate-300">
                            {e.employeeName}
                            {e.leaveType && <span className="text-slate-500"> · {e.leaveType}</span>}
                          </p>
                        ))}
                      </div>
                    )}
                    {absent.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[11px] font-medium text-red-400">Absent ({absent.length})</p>
                        {absent.map((e) => (
                          <p key={e.employeeId} className="text-xs text-slate-300">{e.employeeName}</p>
                        ))}
                      </div>
                    )}
                    {present.length > 0 && (
                      <p className="text-[11px] font-medium text-green-400">Present ({present.length})</p>
                    )}
                    {leave.length === 0 && absent.length === 0 && present.length === 0 && (
                      <p className="text-xs text-slate-400">
                        {off[0]?.status === "HOLIDAY" ? "Holiday" : "Weekly off"}: no one is expected
                      </p>
                    )}
                    {leave.length === 0 && present.length > 0 && (
                      <p className="mt-1 text-[11px] text-slate-500">No one on leave</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
