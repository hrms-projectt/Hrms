"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, LogIn, LogOut, RefreshCw } from "lucide-react";
import Alert from "./common/Alert";
import Button from "./common/Button";
import InputField from "./common/InputField";
import StatusBadge from "./common/StatusBadge";
import {
  checkIn,
  checkOut,
  formatMinutes,
  getTodayAttendance,
} from "@/services/attendanceService";

/**
 * T-8 Employee Check-In / Check-Out widget.
 * Uses Srilekha's shared Fetch API service and approved dark HRMS styles.
 * Pass employeeId from the authenticated user where available.
 * The backend response is expected to expose checkedIn, checkedOut,
 * checkInTime, checkOutTime, status and optionally workingMinutes.
 */
export default function AttendanceWidget({ employeeId: suppliedEmployeeId = "" }) {
  const [employeeId, setEmployeeId] = useState(
    suppliedEmployeeId ? String(suppliedEmployeeId) : ""
  );
  const [idInput, setIdInput] = useState("");
  const [today, setToday] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const busy = useRef(false);

  // Browser storage is read only after mount; this avoids SSR localStorage errors.
  useEffect(() => {
    if (suppliedEmployeeId) {
      setEmployeeId(String(suppliedEmployeeId));
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const id = user.employeeId ?? user.employee?.id ?? "";
      if (id !== "") setEmployeeId(String(id));
      else {
        // Compatibility fallback for Tintu's earlier login implementation.
        const storedId = localStorage.getItem("employeeId");
        if (storedId) setEmployeeId(storedId);
      }
    } catch {
      setError("Could not read the logged-in employee details. Please log in again.");
    }
  }, [suppliedEmployeeId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadToday = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getTodayAttendance(employeeId);
      setToday(data || {});
    } catch (err) {
      setToday(null);
      setError(err.message || "Could not load today's attendance.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) loadToday();
  }, [employeeId, loadToday]);

  const saveEmployeeId = (event) => {
    event.preventDefault();
    const value = idInput.trim();
    if (!/^\d+$/.test(value)) {
      setError("Enter a valid numeric Employee ID.");
      return;
    }
    localStorage.setItem("employeeId", value);
    setError("");
    setEmployeeId(value);
  };

  const checkedIn = Boolean(today?.checkedIn || today?.checkInTime || today?.checkIn);
  const checkedOut = Boolean(today?.checkedOut || today?.checkOutTime || today?.checkOut);
  const completed = checkedIn && checkedOut;
  const buttonLabel = submitting
    ? "Please wait..."
    : completed
      ? "Attendance completed for today"
      : checkedIn
        ? "Clock Out"
        : "Clock In";

  const handleAttendance = async () => {
    if (busy.current || !employeeId || !today || completed) return;
    busy.current = true;
    setSubmitting(true);
    setNotice({ type: "", message: "" });
    try {
      const isClockIn = !checkedIn;
      const result = isClockIn ? await checkIn(employeeId) : await checkOut(employeeId);
      await loadToday();
      const recordedTime = isClockIn
        ? result?.checkInTime || result?.time
        : result?.checkOutTime || result?.time;
      setNotice({
        type: "success",
        message: `${isClockIn ? "Clocked in" : "Clocked out"} successfully${recordedTime ? ` at ${recordedTime}` : ""}.`,
      });
    } catch (err) {
      setNotice({ type: "error", message: err.message || "Attendance action failed." });
      // Reload to synchronize UI if backend reports a duplicate or conflict.
      await loadToday();
    } finally {
      setSubmitting(false);
      busy.current = false;
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Clock3 size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-100">My Attendance</h2>
              <p className="text-xs text-slate-400">{now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
          </div>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-slate-100 sm:text-3xl">
          {now.toLocaleTimeString("en-IN")}
        </p>
      </div>

      <div className="mt-4">
        <Alert type={notice.type || "info"} message={notice.message} />
      </div>

      {!employeeId ? (
        <form onSubmit={saveEmployeeId} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full max-w-sm">
            <InputField label="Employee ID" name="employeeId" value={idInput}
              onChange={(event) => setIdInput(event.target.value)} placeholder="Enter your employee ID" />
          </div>
          <Button type="submit">Continue</Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      ) : (
        <>
          {error && <div className="mt-4"><Alert type="error" message={error} /></div>}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Clock In</p>
              <p className="mt-1 font-semibold text-slate-100">{today?.checkInTime || today?.checkIn || "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Clock Out</p>
              <p className="mt-1 font-semibold text-slate-100">{today?.checkOutTime || today?.checkOut || "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-2"><StatusBadge status={today?.status || (completed ? "COMPLETED" : checkedIn ? "PRESENT" : "PENDING")} /></div>
            </div>
          </div>
          {today?.workingMinutes !== undefined && today?.workingMinutes !== null && (
            <p className="mt-3 text-sm text-slate-400">Working time today: <span className="font-semibold text-slate-200">{formatMinutes(today.workingMinutes)}</span></p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={handleAttendance} loading={submitting} disabled={loading || !today || completed}
              variant={checkedIn ? "danger" : "success"} className="min-w-48">
              {checkedIn ? <LogOut size={16} /> : <LogIn size={16} />}
              {buttonLabel}
            </Button>
            <Button variant="secondary" onClick={loadToday} disabled={loading || submitting}>
              <RefreshCw size={15} /> {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <span className="text-xs text-slate-500">Employee ID: {employeeId}</span>
          </div>
        </>
      )}
    </section>
  );
}
