// Small coloured pill that shows the logged-in user's role.
const STYLES = {
  SUPER_ADMIN: { label: "Super Admin", cls: "bg-purple-500/15 text-purple-400" },
  HR_ADMIN: { label: "HR Admin", cls: "bg-sky-500/15 text-sky-400" },
  MANAGER: { label: "Manager", cls: "bg-orange-500/15 text-orange-400" },
  EMPLOYEE: { label: "Employee", cls: "bg-green-500/15 text-green-400" },
};

export default function RoleBadge({ role }) {
  const name = typeof role === "object" && role !== null ? role.name : role;
  const style = STYLES[name] || {
    label: name || "User",
    cls: "bg-slate-700/40 text-slate-300",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style.cls}`}
    >
      {style.label}
    </span>
  );
}
