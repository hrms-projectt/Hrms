import { request } from "./api";
import { ENDPOINTS } from "./endpoints";

// Weekly-off days. "key" is what is sent to / read from the API.
export const DAYS = [
  { key: "SUNDAY", short: "Sun" },
  { key: "MONDAY", short: "Mon" },
  { key: "TUESDAY", short: "Tue" },
  { key: "WEDNESDAY", short: "Wed" },
  { key: "THURSDAY", short: "Thu" },
  { key: "FRIDAY", short: "Fri" },
  { key: "SATURDAY", short: "Sat" },
];

// DEMO MODE: NEXT_PUBLIC_DEMO_SHIFTS=true in .env.local lets you try the screen
// before Naresh's Shift API exists. Data lives only until you refresh the page.
// REMOVE that line for the real test.
const DEMO = process.env.NEXT_PUBLIC_DEMO_SHIFTS === "true";

let demoShifts = [
  { id: 1, name: "General Shift", startTime: "09:00", endTime: "18:00", breakMinutes: 60, weeklyOffDays: ["SATURDAY", "SUNDAY"] },
  { id: 2, name: "Morning Shift", startTime: "06:00", endTime: "14:00", breakMinutes: 30, weeklyOffDays: ["SUNDAY"] },
  { id: 3, name: "Night Shift", startTime: "22:00", endTime: "06:00", breakMinutes: 45, weeklyOffDays: ["SUNDAY"] },
];
let demoNextId = 4;

// ---------- helpers ----------
const toDayKey = (value) =>
  DAYS.find((d) => d.key.slice(0, 3) === String(value).toUpperCase().slice(0, 3))?.key;

const normalizeDays = (value) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return [...new Set(list.map((v) => toDayKey(String(v).trim())).filter(Boolean))];
};

// "09:00:00" -> "09:00"   |   [9, 0] -> "09:00"
const toHHMM = (t) => {
  if (Array.isArray(t)) {
    return `${String(t[0] ?? 0).padStart(2, "0")}:${String(t[1] ?? 0).padStart(2, "0")}`;
  }
  return t ? String(t).slice(0, 5) : "";
};

// Naresh's Shift entity -> the shape the page uses
const normalize = (s) => ({
  id: s.id,
  name: s.name || s.shiftName || "",
  startTime: toHHMM(s.startTime),
  endTime: toHHMM(s.endTime),
  breakMinutes: Number(s.breakDurationMinutes ?? s.breakMinutes ?? s.breakDuration ?? 0),
  weeklyOffDays: normalizeDays(s.weeklyOffDays ?? s.weeklyOff),
});

// page form -> JSON body for the API
const toPayload = (form) => ({
  name: form.name.trim(),
  startTime: form.startTime, // "HH:mm"
  endTime: form.endTime,
  breakDurationMinutes: Number(form.breakMinutes),
  weeklyOffDays: form.weeklyOffDays, // ["SUNDAY", "SATURDAY"]
});

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// shift ends on the next day (night shift)
export const isOvernight = (start, end) =>
  Boolean(start && end) && toMinutes(end) < toMinutes(start);

// total minutes between start and end, minus the break
export const workingMinutes = (start, end, breakMinutes) => {
  if (!start || !end) return 0;
  const s = toMinutes(start);
  const e = toMinutes(end);
  const span = e > s ? e - s : 24 * 60 - s + e;
  return Math.max(0, span - (Number(breakMinutes) || 0));
};

export const formatDuration = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

// "18:00" -> "06:00 PM"
export const formatTime12 = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
};

// ---------- API calls ----------

// GET /api/v1/shifts
export const getShifts = async () => {
  if (DEMO) return demoShifts.map((s) => ({ ...s }));
  const data = await request(ENDPOINTS.shifts);
  const list = Array.isArray(data) ? data : data?.shifts || data?.content || [];
  return list.map(normalize);
};

// POST /api/v1/shifts
export const createShift = async (form) => {
  if (DEMO) {
    demoShifts = [...demoShifts, { id: demoNextId++, ...toPayload(form), breakMinutes: Number(form.breakMinutes) }];
    return {};
  }
  return request(ENDPOINTS.shifts, { method: "POST", body: JSON.stringify(toPayload(form)) });
};

// PUT /api/v1/shifts/{id}
export const updateShift = async (id, form) => {
  if (DEMO) {
    demoShifts = demoShifts.map((s) =>
      s.id === id ? { id, name: form.name.trim(), startTime: form.startTime, endTime: form.endTime, breakMinutes: Number(form.breakMinutes), weeklyOffDays: form.weeklyOffDays } : s
    );
    return {};
  }
  return request(ENDPOINTS.shift(id), { method: "PUT", body: JSON.stringify(toPayload(form)) });
};

// DELETE /api/v1/shifts/{id}
export const deleteShift = async (id) => {
  if (DEMO) {
    demoShifts = demoShifts.filter((s) => s.id !== id);
    return {};
  }
  return request(ENDPOINTS.shift(id), { method: "DELETE" });
};
