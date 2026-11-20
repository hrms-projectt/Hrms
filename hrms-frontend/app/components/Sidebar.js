"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  CalendarCheck,
  UserCheck,
  FileText,
  Settings,
  LogOut,
  Building2,
  UserPlus,
  Briefcase,
  FileCheck2,
  Clock,
  ClipboardCheck,
  Wallet,
  Banknote,
  ClipboardList,
  CalendarDays,
  Receipt,
} from "lucide-react";
import { logoutUser } from "../../services/authService";
import { getPendingCount } from "../../services/documentService";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [role, setRole] = useState("");
  const [pendingDocs, setPendingDocs] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setRole(user.role || "");
    } catch {
      setRole("");
    }
  }, []);

  // red number on "Documents" = how many documents wait for review.
  // The Documents page fires "documents-changed" after every action.
  useEffect(() => {
    if (!["SUPER_ADMIN", "HR_ADMIN"].includes(role)) return;
    const load = () =>
      getPendingCount()
        .then(setPendingDocs)
        .catch(() => {});
    load();
    window.addEventListener("documents-changed", load);
    return () => window.removeEventListener("documents-changed", load);
  }, [role]);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Onboarding", href: "/onboarding", icon: ClipboardList },
    { name: "Team Calendar", href: "/team-calendar", icon: CalendarDays },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck },
    { name: "Leave Management", href: "/leave", icon: UserCheck },
    { name: "Recruitment", href: "/recruitment", icon: Briefcase },
    { name: "Documents", href: "/documents", icon: FileCheck2 },
    { name: "Shifts", href: "/shifts", icon: Clock },
    { name: "Manager Portal", href: "/manager", icon: ClipboardCheck },
    { name: "Salary Structure", href: "/salary-structure", icon: Wallet },
    { name: "Payroll", href: "/payroll", icon: Banknote },
    { name: "Payroll Draft", href: "/payroll/draft", icon: Receipt },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Organization", href: "/organization", icon: Building2 },
    { name: "Add User", href: "/users/new", icon: UserPlus },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Pages listed here are visible only to these roles.
  // Pages not listed are visible to everyone.
  const roleAccess = {
    "/organization": ["SUPER_ADMIN"],
    "/users/new": ["SUPER_ADMIN"],
    "/recruitment": ["SUPER_ADMIN", "HR_ADMIN"],
    "/documents": ["SUPER_ADMIN", "HR_ADMIN"],
    "/shifts": ["SUPER_ADMIN", "HR_ADMIN"],
    "/attendance": ["SUPER_ADMIN", "HR_ADMIN"],
    "/salary-structure": ["SUPER_ADMIN", "HR_ADMIN", "FINANCE_ADMIN"],
    "/payroll": ["SUPER_ADMIN", "HR_ADMIN", "FINANCE_ADMIN"],
    "/payroll/draft": ["SUPER_ADMIN", "HR_ADMIN", "FINANCE_ADMIN"],
    "/onboarding": ["SUPER_ADMIN", "HR_ADMIN"],
    // managers only (in demo mode a Super Admin may open it too, for testing)
    "/manager": ["MANAGER", ...(process.env.NEXT_PUBLIC_DEMO_APPROVALS === "true" ? ["SUPER_ADMIN"] : [])],
  };

  const visibleItems = menuItems.filter(
    (item) => !roleAccess[item.href] || roleAccess[item.href].includes(role)
  );

  // Highlight only ONE menu item: the longest matching path.
  // (Without this, /payroll/draft would light up both "Payroll" and "Payroll Draft".)
  const activeHref = visibleItems
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg md:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-[#080d1a] text-slate-200 transition-all duration-300
          ${isOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo + collapse button (desktop) */}
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full border-2 border-[#2a8fd0] p-0.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sky-300">
                <Building2 size={16} />
              </div>
            </div>
            {isOpen && <h1 className="text-base font-semibold">HRMS</h1>}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto hidden rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white md:block"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 pt-6">
          {isOpen && (
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Menu
            </p>
          )}

          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;

              const isActive = item.href === activeHref;

              const showBadge = item.href === "/documents" && pendingDocs > 0;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={!isOpen ? item.name : undefined}
                  className={`relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition
                    ${
                      isActive
                        ? "bg-sky-500/15 text-sky-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }
                    ${!isOpen ? "justify-center px-0" : ""}
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  {isOpen && <span>{item.name}</span>}

                  {/* pending documents badge */}
                  {showBadge && isOpen && (
                    <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {pendingDocs > 99 ? "99+" : pendingDocs}
                    </span>
                  )}
                  {showBadge && !isOpen && (
                    <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            title={!isOpen ? "Logout" : undefined}
            className={`flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400
              ${!isOpen ? "justify-center px-0" : ""}
            `}
          >
            <LogOut size={18} />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
