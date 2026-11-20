"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import AttendanceFilters from "../components/AttendanceFilters";
import AttendanceTable from "../components/AttendanceTable";
import { Users, UserCheck, Clock, UserX, AlertCircle } from "lucide-react";
import { getAttendance, defaultRange, daysBetween } from "@/services/attendanceService";

const ALLOWED_ROLES = ["SUPER_ADMIN", "HR_ADMIN"];
const MAX_DAYS = 93; // about 3 months per search

const emptyFilters = () => ({ search: "", department: "", status: "", ...defaultRange() });

export default function AttendancePage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latestRequest = useRef(0);

  // Only SUPER_ADMIN and HR_ADMIN can open this page
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

  // date range problems are shown inside the filter bar
  const { from, to } = filters;
  let rangeError = "";
  if (!from || !to) rangeError = "Please choose both dates.";
  else if (from > to) rangeError = "The start date must be before the end date.";
  else if (daysBetween(from, to) > MAX_DAYS) rangeError = `Please choose a range of ${MAX_DAYS} days or less.`;

  // load from the API whenever the date range changes
  // (department, status and search are filtered in the browser)
  useEffect(() => {
    if (!allowed || rangeError) return;
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError("");

    getAttendance({ from, to })
      .then((data) => {
        if (requestId === latestRequest.current) setRecords(data);
      })
      .catch((err) => {
        if (requestId === latestRequest.current) {
          setRecords([]);
          setError(err.message || "Could not load attendance");
        }
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });
  }, [allowed, from, to, rangeError]);

  const departments = useMemo(
    () => [...new Set(records.map((r) => r.department).filter((d) => d && d !== "-"))].sort(),
    [records]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return records.filter((r) => {
      if (filters.department && r.department !== filters.department) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (q && !r.employeeName.toLowerCase().includes(q) && !r.employeeCode.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [records, filters.department, filters.status, filters.search]);

  const count = (status) => filtered.filter((r) => r.status === status).length;

  const cards = [
    { label: "Total Records", value: filtered.length, icon: Users, iconStyle: "bg-sky-500/15 text-sky-400" },
    { label: "Present", value: count("PRESENT"), icon: UserCheck, iconStyle: "bg-green-500/15 text-green-400" },
    { label: "Late", value: count("LATE"), icon: Clock, iconStyle: "bg-orange-500/15 text-orange-400" },
    { label: "Absent", value: count("ABSENT"), icon: UserX, iconStyle: "bg-red-500/15 text-red-400" },
  ];

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Attendance History
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Check-in, check-out and working hours of all employees.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* summary of the filtered result */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-1 text-3xl font-semibold text-slate-100">
                  {loading ? "..." : item.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconStyle}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tintu: filter / search component */}
      <div className="mb-6">
        <AttendanceFilters
          value={filters}
          onChange={setFilters}
          departments={departments}
          onReset={() => setFilters(emptyFilters())}
          error={rangeError}
        />
      </div>

      {/* Srilekha: main table */}
      <AttendanceTable records={filtered} loading={loading} />
    </MainLayout>
  );
}
