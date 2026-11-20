import { request } from "./api";
import { ENDPOINTS } from "./endpoints";
import { prettyLeaveType } from "./leaveService";

// kept so app/manager/page.js and Sidebar.js need no change (demo mode is removed)
export const IS_DEMO = false;

// ---------- leave request statuses ----------
export const REQUEST_STATUSES = [
  { key: "PENDING", label: "Pending", badge: "bg-yellow-500/15 text-yellow-400" },
  { key: "APPROVED", label: "Approved", badge: "bg-green-500/15 text-green-400" },
  { key: "REJECTED", label: "Rejected", badge: "bg-red-500/15 text-red-400" },
  { key: "CANCELLED", label: "Cancelled", badge: "bg-slate-700/40 text-slate-300" },
];

// ---------- calendar colours (Tintu's calendar) ----------
// Every attendance / leave status is grouped into one of these:
//   PRESENT (green) | ABSENT (red) | LEAVE (blue) | OFF (grey)
export const CALENDAR_GROUPS = {
  PRESENT: { label: "Present", dot: "bg-green-400", tint: "bg-green-500/10", text: "text-green-400" },
  ABSENT: { label: "Absent", dot: "bg-red-400", tint: "bg-red-500/10", text: "text-red-400" },
  LEAVE: { label: "On Leave", dot: "bg-sky-400", tint: "bg-sky-500/10", text: "text-sky-400" },
  OFF: { label: "Off", dot: "bg-slate-500", tint: "bg-slate-700/20", text: "text-slate-400" },
};

export const calendarGroup = (status) => {
  const s = String(status || "").toUpperCase();
  if (["PRESENT", "LATE", "OVERTIME", "EARLY_EXIT", "HALF_DAY"].includes(s)) return "PRESENT";
  if (s === "ABSENT") return "ABSENT";
  if (s === "LEAVE" || s === "ON_LEAVE") return "LEAVE";
  return "OFF"; // WEEKLY_OFF, HOLIDAY, anything else
};

// entries -> { "2026-10-05": [entry, entry, ...] }
export const groupByDate = (entries) => {
  const map = {};
  for (const e of entries) (map[e.date] ||= []).push(e);
  return map;
};

// tells the calendar (Tintu) to reload after a leave was approved or rejected
export const notifyApprovalsChanged = () =>
  typeof window !== "undefined" && window.dispatchEvent(new Event("approvals-changed"));

// ---------- small helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const countDays = (start, end) => {
  if (!start || !end) return 0;
  const diff = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};
export const formatDate = (iso) =>
  iso
    ? new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; // "2026-10"

// ---------- API record -> the shape the pages use ----------
const normalizeTeamMember = (m) => ({
  id: m.id ?? m.employeeId,
  name: m.name || m.fullName || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Unknown",
  code: m.employeeCode || m.code || "",
  department: (typeof m.department === "string" ? m.department : m.department?.name) || "",
  designation: m.designation || "",
});

const normalizeRequest = (r) => {
  const emp = r.employee || {};
  const start = String(r.startDate || r.fromDate || "").slice(0, 10);
  const end = String(r.endDate || r.toDate || "").slice(0, 10);
  return {
    id: r.id,
    employeeId: r.employeeId ?? emp.id,
    employeeName:
      r.employeeName || r.employeeFullName || emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Unknown",
    employeeCode: r.employeeCode || emp.employeeCode || "",
    department: (typeof r.department === "string" ? r.department : r.department?.name) || emp.department || "",
    leaveType: prettyLeaveType(r.leaveType?.name || r.leaveType || r.leaveTypeName),
    startDate: start,
    endDate: end,
    days: r.days ?? r.totalDays ?? countDays(start, end),
    reason: r.reason || "",
    status: String(r.status || "PENDING").trim().toUpperCase(),
    appliedOn: String(r.appliedOn || r.appliedDate || r.createdAt || "").slice(0, 10),
    attachmentName: r.attachmentName || "",
    attachmentUrl: r.attachmentUrl || "",
    managerComment: r.managerComment || r.comment || r.remarks || "",
  };
};

const normalizeCalendarEntry = (e) => ({
  date: String(e.date || e.attendanceDate || "").slice(0, 10),
  employeeId: e.employeeId ?? e.employee?.id,
  employeeName: e.employeeName || e.employee?.fullName || "Unknown",
  status: String(e.status || "").trim().toUpperCase().replace(/[\s-]+/g, "_"),
  leaveType: e.leaveType?.name || e.leaveType || "",
});

// ---------- API calls ----------
const toArray = (data, ...keys) => {
  if (Array.isArray(data)) return data;
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k];
  return Array.isArray(data?.content) ? data.content : [];
};

const byNewest = (a, b) => b.appliedOn.localeCompare(a.appliedOn) || Number(b.id) - Number(a.id);

// GET /api/v1/leaves?status=PENDING  (and APPROVED / REJECTED for the other tabs)
// The SERVER must return only the logged-in manager's team (ask Naresh to confirm).
// The three calls run at the same time and share one result.
let inflight = null;
const fetchTeamLeaves = () => {
  if (!inflight) {
    inflight = (async () => {
      const [pending, approved, rejected] = await Promise.allSettled(
        ["PENDING", "APPROVED", "REJECTED"].map((st) => request(`${ENDPOINTS.leaves}?status=${st}`))
      );
      if (pending.status === "rejected") throw pending.reason; // PENDING is the main list
      return [pending, approved, rejected]
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => toArray(r.value, "leaves", "requests"))
        .map(normalizeRequest)
        .sort(byNewest);
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
};

export const getTeamLeaveRequests = () => fetchTeamLeaves();

// Naresh has no "my team" API yet, so the team strip is built from the people who
// appear in the requests. (ASK NARESH for GET /manager/team and put it here.)
export const getManagerTeam = async () => {
  const requests = await fetchTeamLeaves();
  const seen = new Map();
  for (const r of requests) {
    if (r.employeeId !== undefined && r.employeeId !== null && !seen.has(r.employeeId)) {
      seen.set(r.employeeId, {
        id: r.employeeId,
        name: r.employeeName,
        code: r.employeeCode,
        department: r.department,
        designation: "",
      });
    }
  }
  return [...seen.values()];
};

// POST /api/v1/leaves/{id}/approve   body: { comment }
export const approveLeave = (id, comment = "") =>
  request(ENDPOINTS.leaveApprove(id), {
    method: "POST",
    body: JSON.stringify({ comment: comment.trim() || "Approved" }),
  });

// POST /api/v1/leaves/{id}/reject   body: { comment }   (the reason goes in "comment")
export const rejectLeave = (id, reason) =>
  request(ENDPOINTS.leaveReject(id), {
    method: "POST",
    body: JSON.stringify({ comment: reason.trim() }),
  });

// ---------- team calendar (Tintu's T-11) ----------
// Built from Naresh's attendance history + approved leaves of the month.
// GET /attendance/history?startDate&endDate   and   GET /leaves?status=APPROVED
// Tintu: if Naresh gives a team-calendar API, replace the body of this function.
export const getTeamCalendar = async (month) => {
  const [year, mon] = month.split("-").map(Number);
  const first = `${month}-01`;
  const last = `${month}-${pad(new Date(year, mon, 0).getDate())}`;
  const query = new URLSearchParams({ startDate: first, endDate: last }).toString();

  const [attendanceData, leaveData] = await Promise.all([
    request(`${ENDPOINTS.attendanceHistory}?${query}`),
    request(`${ENDPOINTS.leaves}?status=APPROVED`),
  ]);

  const entries = new Map(); // "employeeId|date" -> entry (leave replaces attendance)
  for (const a of toArray(attendanceData, "records")) {
    const date = String(a.attendanceDate || a.date || "").slice(0, 10);
    if (!date) continue;
    const status =
      String(a.status || "").trim().toUpperCase().replace(/[\s-]+/g, "_") || "PRESENT";
    entries.set(`${a.employeeId}|${date}`, {
      date,
      employeeId: a.employeeId,
      employeeName: a.employeeName || "Unknown",
      status,
      leaveType: "",
    });
  }

  for (const raw of toArray(leaveData, "leaves", "requests")) {
    const r = normalizeRequest(raw);
    if (!r.startDate || !r.endDate) continue;
    for (let d = new Date(`${r.startDate}T00:00:00`); toISO(d) <= r.endDate; d = addDays(d, 1)) {
      const date = toISO(d);
      if (date < first || date > last) continue;
      entries.set(`${r.employeeId}|${date}`, {
        date,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        status: "LEAVE",
        leaveType: r.leaveType,
      });
    }
  }
  return [...entries.values()];
};
