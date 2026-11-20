"use client";

const statusStyles = {
  ACTIVE: "bg-green-500/15 text-green-400",
  PRESENT: "bg-green-500/15 text-green-400",
  APPROVED: "bg-green-500/15 text-green-400",
  VERIFIED: "bg-green-500/15 text-green-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  PENDING: "bg-yellow-500/15 text-yellow-400",
  LATE: "bg-orange-500/15 text-orange-400",
  REQUEST_REUPLOAD: "bg-orange-500/15 text-orange-400",
  ABSENT: "bg-red-500/15 text-red-400",
  REJECTED: "bg-red-500/15 text-red-400",
  INACTIVE: "bg-slate-700/50 text-slate-400",
  CANCELLED: "bg-slate-700/50 text-slate-400",
  LEAVE: "bg-sky-500/15 text-sky-400",
  ON_LEAVE: "bg-sky-500/15 text-sky-400",
  HALF_DAY: "bg-yellow-500/15 text-yellow-400",
  EARLY_EXIT: "bg-orange-500/15 text-orange-400",
  OVERTIME: "bg-green-500/15 text-green-300",
  HOLIDAY: "bg-purple-500/15 text-purple-400",
  WEEKLY_OFF: "bg-slate-700/50 text-slate-300",
  NOT_UPLOADED: "bg-slate-700/50 text-slate-400",
};

const statusLabels = {
  REQUEST_REUPLOAD: "Re-upload requested",
  NOT_UPLOADED: "Not uploaded",
  ON_LEAVE: "On Leave",
  HALF_DAY: "Half Day",
  EARLY_EXIT: "Early Exit",
  WEEKLY_OFF: "Weekly Off",
};

export default function StatusBadge({ status, label, className = "" }) {
  const key = String(status || "UNKNOWN").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const display = label || statusLabels[key] || key.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[key] || "bg-slate-700/50 text-slate-300"} ${className}`}>
      {display || "—"}
    </span>
  );
}
