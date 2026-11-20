"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import ManagerApprovals from "../components/ManagerApprovals"; // Srilekha: S-11 approvals
import TeamCalendar from "../components/TeamCalendar"; // Tintu: T-11 calendar
import { IS_DEMO } from "@/services/managerService";

// Only managers use the Manager Portal. In demo mode a Super Admin may also open it,
// so the screen can be tested without a manager account.
const ALLOWED_ROLES = IS_DEMO ? ["MANAGER", "SUPER_ADMIN"] : ["MANAGER"];

export default function ManagerPortalPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (ALLOWED_ROLES.includes(user.role)) {
        setAllowed(true);
      } else {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Manager Portal
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Approve your team&apos;s leave and see who is away.
        </p>
      </div>

      {IS_DEMO && (
        <p className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-xs text-orange-300">
          Demo mode: sample data, nothing is saved.
        </p>
      )}

      {/* Srilekha: Pending Approvals */}
      <ManagerApprovals />

      {/* Tintu: Team Attendance & Leave calendar */}
      <TeamCalendar />
    </MainLayout>
  );
}
