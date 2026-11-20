"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "./Alert.jsx";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
} from "../../../services/tintu/attendanceService.js";
import { callApi } from "../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../services/tintu/utils/getErrorMessage.js";
import { useSession } from "../../../services/tintu/utils/useSession.js";

const formatMinutes = (m) => {
  const n = Number(m);
  if (!n && n !== 0) return "";
  return `${Math.floor(n / 60)}h ${n % 60}m`;
};

export default function AttendanceWidget() {
  const session = useSession();
  const [employeeId, setEmployeeId] = useState("");

  // pre-fill with the logged-in employee's ID (read after first render)
  useEffect(() => {
    if (session.employeeId) setEmployeeId((current) => current || session.employeeId);
  }, [session.employeeId]);
  const [idInput, setIdInput] = useState("");

  const [today, setToday] = useState(null); // response of GET /attendance/today/{id}
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [summary, setSummary] = useState(null); // working minutes + status after clock-out
  const [now, setNow] = useState(new Date());
  const busy = useRef(false); // extra guard against double clicks

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadToday = useCallback(async () => {
    if (!employeeId) return null;
    setLoading(true);
    setLoadError("");
    const result = await callApi(() => getTodayAttendance(employeeId));
    setLoading(false);
    if (result.ok) {
      setToday(result.data);
      return result.data;
    }
    setToday(null);
    setLoadError(getErrorMessage(result));
    return null;
  }, [employeeId]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const saveEmployeeId = (e) => {
    e.preventDefault();
    if (!/^\d+$/.test(idInput.trim())) {
      setLoadError("Enter a valid numeric employee ID (for example 1)");
      return;
    }
    localStorage.setItem("employeeId", idInput.trim());
    setLoadError("");
    setEmployeeId(idInput.trim());
  };

  const handleClick = async () => {
    if (busy.current || !today) return;
    busy.current = true;
    setSubmitting(true);
    setAlert({ type: "", message: "" });

    const clockingIn = !today.checkedIn;
    const result = await callApi(() =>
      clockingIn ? checkIn(employeeId) : checkOut(employeeId)
    );

    if (result.ok) {
      const d = result.data || {};
      const fresh = await loadToday();
      if (clockingIn) {
        const time = d.checkInTime || fresh?.checkInTime || "";
        setAlert({
          type: "success",
          message: `Clocked in successfully at ${time || "the current time"}.`,
        });
      } else {
        const time = d.checkOutTime || fresh?.checkOutTime || "";
        setSummary({
          minutes: d.workingMinutes,
          status: d.status || fresh?.status,
        });
        setAlert({
          type: "success",
          message: `Clocked out successfully at ${time || "the current time"}.`,
        });
      }
    } else if (result.status === 409) {
      await loadToday();
      setAlert({
        type: "error",
        message: "You have already checked in today.",
      });
    } else {
      setAlert({ type: "error", message: getErrorMessage(result) });
    }

    setSubmitting(false);
    busy.current = false;
  };

  // ---------- Button state ----------
  const completed = today?.checkedIn && today?.checkedOut;
  const clockedIn = today?.checkedIn && !today?.checkedOut;

  let buttonLabel = "Clock In";
  let buttonColor = "bg-green-600 hover:bg-green-700";
  if (clockedIn) {
    buttonLabel = "Clock Out";
    buttonColor = "bg-red-600 hover:bg-red-700";
  }
  if (completed) {
    buttonLabel = "Attendance completed for today";
    buttonColor = "bg-slate-600";
  }
  if (submitting) buttonLabel = "Please wait...";

  const disabled = submitting || loading || !today || completed;

  return (
    <div className="mb-8 rounded-2xl bg-[#111833] p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Attendance</h2>
          <p className="text-sm text-slate-400">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <p className="text-3xl font-bold tabular-nums text-slate-100">
          {now.toLocaleTimeString()}
        </p>
      </div>

      <div className="mt-4">
        <Alert type={alert.type} message={alert.message} />
      </div>

      {/* Employee ID is needed first */}
      {!employeeId ? (
        <form onSubmit={saveEmployeeId} className="mt-2">
          <p className="mb-2 text-sm text-slate-300">
            Enter your Employee ID to use attendance.
          </p>
          <div className="flex gap-2">
            <input
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="Employee ID (e.g. 1)"
              className="w-full max-w-xs rounded-lg border border-white/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600">
              Save
            </button>
          </div>
          {loadError && <p className="mt-2 text-xs text-red-400">{loadError}</p>}
        </form>
      ) : (
        <>
          {loading && !today && (
            <p className="mb-3 text-sm text-slate-400">Checking today's attendance...</p>
          )}

          {loadError && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {loadError}{" "}
              <button onClick={loadToday} className="ml-2 font-semibold underline">
                Try again
              </button>
            </div>
          )}

          <button
            onClick={handleClick}
            disabled={disabled}
            className={`w-full rounded-xl py-4 text-lg font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonColor}`}
          >
            {buttonLabel}
          </button>

          {today && (
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-[#0f1a2e] p-3">
                <p className="text-xs uppercase text-slate-400">Clock In</p>
                <p className="mt-1 font-semibold text-slate-100">
                  {today.checkInTime || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[#0f1a2e] p-3">
                <p className="text-xs uppercase text-slate-400">Clock Out</p>
                <p className="mt-1 font-semibold text-slate-100">
                  {today.checkOutTime || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[#0f1a2e] p-3">
                <p className="text-xs uppercase text-slate-400">Status</p>
                <p className="mt-1 font-semibold text-slate-100">
                  {summary?.status || today.status || "—"}
                </p>
              </div>
            </div>
          )}

          {summary?.minutes != null && summary.minutes !== "" && (
            <p className="mt-3 text-sm text-slate-300">
              Working time today:{" "}
              <span className="font-semibold">{formatMinutes(summary.minutes)}</span>
            </p>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Employee ID: {employeeId} ·{" "}
            <button
              onClick={() => {
                localStorage.removeItem("employeeId");
                setEmployeeId("");
                setToday(null);
                setSummary(null);
              }}
              className="underline"
            >
              change
            </button>
          </p>
        </>
      )}
    </div>
  );
}