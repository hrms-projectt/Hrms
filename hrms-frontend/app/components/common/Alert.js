"use client";

import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

const styles = {
  error: {
    wrapper: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: AlertCircle,
  },
  success: {
    wrapper: "border-green-500/30 bg-green-500/10 text-green-300",
    icon: CheckCircle2,
  },
  warning: {
    wrapper: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    icon: AlertTriangle,
  },
  info: {
    wrapper: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    icon: Info,
  },
};

export default function Alert({
  type = "error",
  message,
  title,
  onClose,
  className = "",
}) {
  if (!message) return null;

  const config = styles[type] || styles.error;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${config.wrapper} ${className}`}
      role={type === "error" ? "alert" : "status"}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="rounded-md p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
