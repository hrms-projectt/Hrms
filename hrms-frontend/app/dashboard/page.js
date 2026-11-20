
"use client";

import { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";
import AttendanceWidget from "../components/AttendanceWidget";
import { Users, Briefcase, UserPlus, FileCheck2 } from "lucide-react";
import { getDashboardData } from "@/services/dashboardService";
import { TableRowsSkeleton } from "../components/Skeleton";

const STAGES = [
  { key: "APPLIED", label: "Applied", dot: "bg-sky-400" },
  { key: "SCREENING", label: "Screening", dot: "bg-yellow-400" },
  { key: "INTERVIEW", label: "Interview", dot: "bg-orange-400" },
  { key: "OFFER", label: "Offer", dot: "bg-green-400" },
];

const up = (value) => String(value || "").toUpperCase();

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardData()
      .then(setData)
      .catch((err) =>
        setError(err.message || "Could not load the dashboard")
      )
      .finally(() => setLoading(false));
  }, []);

  const show = (value) =>
    loading
      ? "..."
      : value === null || value === undefined
      ? "-"
      : value;

  const employees = data?.employees ?? null;
  const jobs = data?.jobs ?? null;
  const candidates = data?.candidates ?? null;
  const documents = data?.documents ?? null;

  const stageCount = (key) =>
    candidates
      ? candidates.filter((c) => up(c.status) === key).length
      : null;

  const pipelineTotal = candidates
    ? candidates.filter((c) =>
        STAGES.some((s) => s.key === up(c.status))
      ).length
    : 0;

  const stagePercent = (key) =>
    pipelineTotal
      ? Math.round(((stageCount(key) || 0) / pipelineTotal) * 100)
      : 0;

  const stats = [
    {
      label: "Total Employees",
      value: show(employees ? employees.length : null),
      icon: Users,
      iconStyle: "bg-sky-500/15 text-sky-400",
    },
    {
      label: "Open Positions",
      value: show(
        jobs
          ? jobs.filter(
              (j) => up(j.status || "OPEN") === "OPEN"
            ).length
          : null
      ),
      icon: Briefcase,
      iconStyle: "bg-green-500/15 text-green-400",
    },
    {
      label: "Candidates in Pipeline",
      value: show(
        candidates
          ? candidates.filter((c) =>
              STAGES.some((s) => s.key === up(c.status))
            ).length
          : null
      ),
      icon: UserPlus,
      iconStyle: "bg-orange-500/15 text-orange-400",
    },
    {
      label: "Documents Pending",
      value: show(
        documents
          ? documents.filter(
              (d) => up(d.status || "PENDING") === "PENDING"
            ).length
          : null
      ),
      icon: FileCheck2,
      iconStyle: "bg-red-500/15 text-red-400",
    },
  ];

  const recentEmployees = employees
    ? [...employees]
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        .slice(0, 5)
    : [];

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Here is a summary of your workforce activity.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Attendance widget */}
      <div className="mb-8">
        <AttendanceWidget />
      </div>

      {/* Dashboard statistic cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div>
                <p className="text-sm text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-3xl font-semibold text-slate-100">
                  {item.value}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconStyle}`}
              >
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent employees */}
        <div className="rounded-2xl border border-white/10 bg-white/5 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold text-slate-100">
              Recent Employees
            </h2>

            <button
              type="button"
              onClick={() => (window.location.href = "/employees")}
              className="rounded-full bg-slate-700/40 px-4 py-1.5 text-xs font-medium transition hover:bg-slate-700/70"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <TableRowsSkeleton rows={3} cols={3} />
                )}

                {!loading &&
                  recentEmployees.map((emp) => {
                    const name = emp.name || "Unknown";
                    const status = emp.status || "UNKNOWN";

                    return (
                      <tr
                        key={emp.id}
                        className="border-t border-white/10 hover:bg-white/5"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full border-2 border-[#2a8fd0] p-0.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-sky-300">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            </div>

                            <div>
                              <p className="font-medium text-slate-100">
                                {name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {emp.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {emp.department || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              up(status) === "ACTIVE"
                                ? "bg-green-500/15 text-green-400"
                                : "bg-slate-700/40 text-slate-300"
                            }`}
                          >
                            {status.charAt(0) +
                              status.slice(1).toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && recentEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-sm text-slate-500"
                    >
                      {employees === null
                        ? "Could not load employees."
                        : "No employees yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recruitment pipeline */}
        <div className="rounded-2xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold text-slate-100">
              Recruitment Pipeline
            </h2>
          </div>

          <ul>
            {STAGES.map((stage) => (
              <li
                key={stage.key}
                className="flex items-start gap-3 border-t border-white/10 px-5 py-4 first:border-t-0"
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${stage.dot}`}
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-200">
                      {stage.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-100">
                      {show(stageCount(stage.key))}
                    </p>
                  </div>

                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${stage.dot}`}
                      style={{
                        width: `${stagePercent(stage.key)}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
