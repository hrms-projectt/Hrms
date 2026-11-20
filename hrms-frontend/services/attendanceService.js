import { request } from "./api";
import { ENDPOINTS } from "./endpoints";

// ---------- statuses (SRS 5.8) ----------
// "badge" = colours of the status pill. LATE is orange so it stands out.
export const STATUSES = [
  { key: "PRESENT", label: "Present", badge: "bg-green-500/15 text-green-400" },
  { key: "LATE", label: "Late", badge: "bg-orange-500/20 text-orange-400" },
  { key: "ABSENT", label: "Absent", badge: "bg-red-500/15 text-red-400" },
  { key: "HALF_DAY", label: "Half Day", badge: "bg-yellow-500/15 text-yellow-400" },
  { key: "EARLY_EXIT", label: "Early Exit", badge: "bg-orange-500/10 text-orange-300" },
  { key: "OVERTIME", label: "Overtime", badge: "bg-green-500/25 text-green-300" },
  { key: "LEAVE", label: "Leave", badge: "bg-sky-500/15 text-sky-400" },
  { key: "HOLIDAY", label: "Holiday", badge: "bg-purple-500/15 text-purple-400" },
  { key: "WEEKLY_OFF", label: "Weekly Off", badge: "bg-slate-700/40 text-slate-300" },
];

// how the check-in was recorded (SRS methods)
export const SOURCES = {
  WEB: "Web",
  MOBILE: "Mobile",
  MANUAL: "Manual HR entry",
  BIOMETRIC: "Biometric",
  API: "API",
};

// ---------- date / time helpers ----------
const pad = (n) => String(n).padStart(2, "0");

export const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// default range = 1st of this month .. today
export const defaultRange = () => {
  const t = new Date();
  return { from: toISODate(new Date(t.getFullYear(), t.getMonth(), 1)), to: toISODate(t) };
};

export const daysBetween = (from, to) =>
  Math.round((new Date(to) - new Date(from)) / 86400000) + 1;

// anything -> "HH:mm"   ("09:05:00", "2026-10-10T09:05:00", [9, 5])
const toHHMM = (t) => {
  if (!t) return "";
  if (Array.isArray(t)) return `${pad(t[0] ?? 0)}:${pad(t[1] ?? 0)}`;
  const m = /(\d{2}):(\d{2})/.exec(String(t));
  return m ? `${m[1]}:${m[2]}` : "";
};

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// "18:05" -> "06:05 PM"
export const formatTime12 = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

// 545 -> "9h 5m"
export const formatMinutes = (mins) =>
  mins === null || mins === undefined ? "-" : `${Math.floor(mins / 60)}h ${mins % 60}m`;

// "2026-10-10" -> "Sat, 10 Oct 2026"
export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ---------- API record -> the shape the page uses ----------
const normalizeStatus = (s) => String(s || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

// Naresh sends  status  plus  isLate / isEarlyExit  flags
const statusOf = (r) => {
  const status = normalizeStatus(r.status);
  if (status === "PRESENT" && r.isLate) return "LATE";
  if (status === "PRESENT" && r.isEarlyExit) return "EARLY_EXIT";
  return status;
};

const normalize = (r) => {
  const checkIn = toHHMM(r.checkIn ?? r.checkInTime);
  const checkOut = toHHMM(r.checkOut ?? r.checkOutTime);

  let minutes = r.workingMinutes ?? null;
  if (minutes === null && r.workingHours !== undefined && r.workingHours !== null) {
    minutes = Math.round(Number(r.workingHours) * 60);
  }
  if ((minutes === null || Number.isNaN(minutes)) && checkIn && checkOut) {
    const diff = toMin(checkOut) - toMin(checkIn);
    minutes = diff >= 0 ? diff : diff + 24 * 60;
  }

  const emp = r.employee || {};
  const dept = r.departmentName ?? r.department ?? emp.department;

  return {
    id: r.id ?? `${r.employeeId ?? emp.id}-${r.date}`,
    employeeId: r.employeeId ?? emp.id,
    employeeName:
      r.employeeName ||
      emp.fullName ||
      `${emp.firstName || r.firstName || ""} ${emp.lastName || r.lastName || ""}`.trim() ||
      "Unknown",
    employeeCode: r.employeeCode || emp.employeeCode || "",
    department: (typeof dept === "string" ? dept : dept?.name) || "-",
    date: String(r.date || r.attendanceDate || "").slice(0, 10),
    checkIn,
    checkOut,
    status: statusOf(r),
    workingMinutes: minutes === undefined || Number.isNaN(minutes) ? null : minutes,
    lateMinutes: r.lateMinutes ?? null,
    source: String(r.method || r.source || "").toUpperCase(),
  };
};

// ---------- API call ----------
// GET /api/v1/attendance/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// (department, status and search are filtered in the browser by the page)
export const getAttendance = async ({ from, to }) => {
  const query = new URLSearchParams({ startDate: from, endDate: to }).toString();
  const data = await request(`${ENDPOINTS.attendanceHistory}?${query}`);
  const list = Array.isArray(data) ? data : data?.records || data?.content || [];
  return list.map(normalize);
};


// ---------- T-8 Employee self-service attendance widget ----------
// These three routes come from Tintu's frontend implementation and MUST be
// confirmed with Naresh against the Spring Boot controller before use.
export const getTodayAttendance = (employeeId) =>
  request(ENDPOINTS.attendanceToday(employeeId));

export const checkIn = (employeeId) =>
  request(ENDPOINTS.attendanceCheckIn, {
    method: "POST",
    body: JSON.stringify({ employeeId: Number(employeeId) }),
  });

export const checkOut = (employeeId) =>
  request(ENDPOINTS.attendanceCheckOut, {
    method: "POST",
    body: JSON.stringify({ employeeId: Number(employeeId) }),
  });
