// Status values (ASSUMED): PENDING, APPROVED, REJECTED, CANCELLED
export const LEAVE_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const statusStyles = {
  PENDING: "bg-yellow-500/100/15 text-yellow-300",
  APPROVED: "bg-green-500/100/15 text-green-300",
  REJECTED: "bg-red-500/100/15 text-red-300",
  CANCELLED: "bg-slate-700 text-slate-300",
};

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Inclusive number of days between two dates (start and end day both count)
export const countDays = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  return Math.round((e - s) / 86400000) + 1;
};