"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { logoutUser } from "../../services/authService";
import ThemeToggle from "./ThemeToggle";
import RoleBadge from "./RoleBadge";

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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

  // first letter of the name for the avatar
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0b1020]/90 px-4 backdrop-blur md:px-8">
      <div className="ml-12 md:ml-0">
        <p className="text-xs text-slate-500">Welcome back</p>
        <h2 className="text-base font-medium text-slate-100">HR Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full border-2 border-[#2a8fd0] p-0.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-sky-300">
              {initial}
            </div>
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-100">
              {user?.fullName || "User"}
            </p>
            <RoleBadge role={user?.role} />
          </div>
        </div>

        <ThemeToggle />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full bg-slate-700/40 px-4 py-2 text-sm font-medium transition hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
