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
} from "lucide-react";
import { logoutUser } from "../../services/authService";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [role, setRole] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setRole(user.role || "");
    } catch {
      setRole("");
    }
  }, []);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck },
    { name: "Leave Management", href: "/leave", icon: UserCheck },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Organization", href: "/organization", icon: Building2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Organization is visible only to SUPER_ADMIN
  const visibleItems = menuItems.filter(
    (item) => item.href !== "/organization" || role === "SUPER_ADMIN"
  );

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
        className={`fixed left-0 top-0 z-40 h-screen border-r border-white/10 bg-[#080d1a] text-slate-200 transition-all duration-300
          ${isOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo + collapse button (desktop) */}
        <div className="flex h-16 items-center border-b border-white/10 px-4">
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
        <div className="px-3 pt-6">
          {isOpen && (
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Menu
            </p>
          )}

          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={!isOpen ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition
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
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 w-full border-t border-white/10 p-3">
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