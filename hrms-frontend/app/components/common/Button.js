"use client";

const variants = {
  primary: "bg-sky-500 text-white hover:bg-sky-600 focus-visible:ring-sky-400",
  secondary: "bg-slate-700/60 text-slate-200 hover:bg-slate-700 focus-visible:ring-slate-400",
  success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400",
  ghost: "bg-transparent text-slate-300 hover:bg-white/10 hover:text-white focus-visible:ring-slate-400",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1020] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
