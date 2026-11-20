import { request } from "./api";
import { ENDPOINTS } from "./endpoints";

export const LEAVE_STATUSES = [
  { key: "PENDING", label: "Pending", badge: "bg-yellow-500/15 text-yellow-400" },
  { key: "APPROVED", label: "Approved", badge: "bg-green-500/15 text-green-400" },
  { key: "REJECTED", label: "Rejected", badge: "bg-red-500/15 text-red-400" },
  { key: "CANCELLED", label: "Cancelled", badge: "bg-slate-700/40 text-slate-300" },
];

// the Leave History table (Tintu) listens to this to reload after a new request
export const notifyLeaveChanged = () =>
  typeof window !== "undefined" && window.dispatchEvent(new Event("leave-changed"));

// ---------- helpers ----------
export const MAX_FILE_MB = 5;
export const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];

// calendar days from start to end, both included (same day = 1)
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

// "5 days" / "Unlimited"
export const balanceText = (b) =>
  b.remaining === null ? "Unlimited" : `${b.remaining} of ${b.total} days left`;

// Returns an object { field: "message" }. Empty object = form is valid.
// Same-day leave (start = end) is allowed and counts as 1 day.
export const validateLeaveForm = (form, balance, file) => {
  const errors = {};
  if (!form.leaveTypeId) errors.leaveTypeId = "Please choose a leave type.";
  if (!form.startDate) errors.startDate = "Please choose the start date.";
  if (!form.endDate) errors.endDate = "Please choose the end date.";

  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = "End date must be after the start date.";
  }

  const days = countDays(form.startDate, form.endDate);
  if (balance && balance.remaining !== null && days > balance.remaining) {
    errors.leaveTypeId = `You asked for ${days} day${days === 1 ? "" : "s"} but only ${balance.remaining} ${
      balance.remaining === 1 ? "day is" : "days are"
    } left for ${balance.name}.`;
  }

  const reason = form.reason.trim();
  if (reason.length < 5) errors.reason = "Please give a reason (at least 5 characters).";
  else if (reason.length > 500) errors.reason = "The reason is too long (maximum 500 characters).";

  if (balance?.requiresAttachment && !file) {
    errors.attachment = "A medical certificate is required for this leave type.";
  }
  return errors;
};

// ---------- who is logged in ----------
// The login response is saved in localStorage "user". Naresh's leave APIs need the
// EMPLOYEE id. If it is not the same number as user.id, change ONLY this function.
export const getEmployeeId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.employeeId ?? user.employee?.id ?? user.id ?? null;
  } catch {
    return null;
  }
};

// "CASUAL" -> "Casual", "EARNED_LEAVE" -> "Earned Leave"
export const prettyLeaveType = (value) =>
  String(value || "Leave")
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

// ---------- API record -> the shape the page uses ----------
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// the code Naresh expects in  POST /leaves  ->  "leaveType": "CASUAL"
const codeOf = (x) => {
  const t = x.leaveType ?? x.type ?? x.code ?? x.name;
  const raw = t && typeof t === "object" ? t.code ?? t.name : t;
  return String(raw ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
};

const toArray = (data, ...keys) => {
  if (Array.isArray(data)) return data;
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k];
  return Array.isArray(data?.content) ? data.content : [];
};

// GET leave/policies  +  GET employees/{id}/leave-balances  ->  one list for the form
//   { id: "CASUAL", name: "Casual", total, used, remaining, requiresAttachment }
// remaining === null means "no limit known".
export const getLeaveBalances = async () => {
  const employeeId = getEmployeeId();
  if (employeeId === null) throw new Error("Could not find your employee id. Please log in again.");

  const [policyRes, balanceRes] = await Promise.allSettled([
    request(ENDPOINTS.leavePolicies),
    request(ENDPOINTS.employeeLeaveBalances(employeeId)),
  ]);
  if (policyRes.status === "rejected" && balanceRes.status === "rejected") throw policyRes.reason;

  const policies = policyRes.status === "fulfilled" ? toArray(policyRes.value, "policies") : [];
  const balances = balanceRes.status === "fulfilled" ? toArray(balanceRes.value, "balances") : [];

  const map = new Map();
  const upsert = (code, patch) => map.set(code, { ...(map.get(code) || { id: code }), ...patch });

  for (const p of policies) {
    const code = codeOf(p);
    if (!code) continue;
    upsert(code, {
      name: p.name || p.displayName || prettyLeaveType(code),
      total: num(p.totalDays ?? p.annualQuota ?? p.maxDays ?? p.daysAllowed ?? p.quota),
      requiresAttachment: Boolean(p.requiresAttachment ?? p.requiresDocument ?? /SICK|MEDICAL/.test(code)),
    });
  }

  for (const b of balances) {
    const code = codeOf(b);
    if (!code) continue;
    const old = map.get(code) || {};
    const total = num(b.totalDays ?? b.total ?? b.allocated ?? b.entitlement ?? b.annualQuota) ?? old.total ?? null;
    const used = num(b.usedDays ?? b.used) ?? 0;
    let remaining = num(b.remainingDays ?? b.remaining ?? b.balance);
    if (remaining === null && total !== null) remaining = total - used;
    upsert(code, {
      name: old.name || b.name || prettyLeaveType(code),
      total,
      used,
      remaining,
      requiresAttachment: old.requiresAttachment ?? /SICK|MEDICAL/.test(code),
    });
  }

  return [...map.values()].map((b) => ({
    used: 0,
    total: null,
    remaining: b.total === null || b.total === undefined ? null : b.total - (b.used || 0),
    requiresAttachment: false,
    ...b,
  }));
};

// POST /api/v1/leaves   (JSON)
//   { employeeId, leaveType, startDate, endDate, reason, attachmentUrl }
// NOTE: Naresh's API takes only a text "attachmentUrl", there is no file upload yet.
// The file chosen in the form is checked but NOT sent until Naresh gives an upload API.
export const applyLeave = async ({ leaveTypeId, startDate, endDate, reason }) =>
  request(ENDPOINTS.leaves, {
    method: "POST",
    body: JSON.stringify({
      employeeId: getEmployeeId(),
      leaveType: leaveTypeId, // "CASUAL"
      startDate,
      endDate,
      reason: reason.trim(),
      attachmentUrl: "",
    }),
  });

const normalizeRequest = (r) => {
  const start = String(r.startDate || r.fromDate || "").slice(0, 10);
  const end = String(r.endDate || r.toDate || "").slice(0, 10);
  return {
    id: r.id,
    leaveType: prettyLeaveType(r.leaveType?.name || r.leaveType || r.leaveTypeName),
    startDate: start,
    endDate: end,
    days: r.days ?? r.totalDays ?? countDays(start, end),
    reason: r.reason || "",
    status: String(r.status || "PENDING").trim().toUpperCase(),
    appliedOn: String(r.appliedOn || r.appliedDate || r.createdAt || "").slice(0, 10),
    attachmentName: r.attachmentName || (r.attachmentUrl ? "Attachment" : ""),
    managerComment: r.managerComment || r.comment || r.remarks || "",
  };
};

// GET /api/v1/leaves?employeeId={id}   -> my leave history (Tintu's table)
// (ASK NARESH: is  ?employeeId=  supported on GET /leaves ? If his URL is different,
//  change it here.)
export const getLeaveHistory = async () => {
  const employeeId = getEmployeeId();
  const data = await request(`${ENDPOINTS.leaves}?employeeId=${encodeURIComponent(employeeId)}`);
  return toArray(data, "leaves", "requests")
    .map(normalizeRequest)
    .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn) || Number(b.id) - Number(a.id));
};
