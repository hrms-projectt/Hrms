"use client";

// S-15  Payroll Processing status dashboard (Finance Admin)
//   "Process Payroll for <month>"  ->  POST /payroll/process/{month}
//   loading bar until the backend answers, then the summary
//   "Total Employees Processed: X" and the list of processed employees.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { Play, CheckCircle2, AlertCircle, Loader2, Users } from "lucide-react";
import {
  PAYROLL_ROLES,
  currentMonth,
  monthLabel,
  formatMoney,
  processPayroll,
} from "@/services/payrollService";

export default function PayrollProcessingPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  const [month, setMonth] = useState(currentMonth);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { month, message, totalProcessed, records }
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (PAYROLL_ROLES.includes(user.role)) setAllowed(true);
      else router.replace("/dashboard");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const handleProcess = async () => {
    if (!month || processing) return; // no double click
    setProcessing(true);
    setError("");
    setResult(null);
    try {
      const data = await processPayroll(month);
      setResult({ month, ...data });
    } catch (err) {
      setError(err.message || "Payroll processing failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!allowed) return null;

  const label = monthLabel(month);

  return (
    <MainLayout>
      <style>{`
        @keyframes payrollSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>

      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Payroll Processing
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Choose a month and run the payroll for all employees.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ---------- trigger ---------- */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="month" className="mb-1.5 block text-xs text-slate-400">
              Payroll month
            </label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={processing}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleProcess}
            disabled={processing || !month}
            className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {processing ? "Processing..." : `Process Payroll for ${label || "[Month]"}`}
          </button>
        </div>

        {/* status / progress */}
        {processing && (
          <div className="mt-6">
            <p className="mb-2 text-sm text-slate-300">
              Processing payroll for {label}. Please keep this page open...
            </p>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-green-400"
                style={{ animation: "payrollSlide 1.4s ease-in-out infinite" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ---------- summary ---------- */}
      {result && (
        <>
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
            <div className="mb-4 h-2 w-full rounded-full bg-white/10">
              <div className="h-2 w-full rounded-full bg-green-400" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <p className="font-semibold text-green-200">
                    Payroll for {monthLabel(result.month)} is processed
                  </p>
                  {result.message && <p className="text-sm text-green-300/80">{result.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/5 px-5 py-3">
                <Users size={20} className="text-sky-400" />
                <p className="text-sm text-slate-300">
                  Total Employees Processed:{" "}
                  <span className="text-xl font-semibold text-slate-100">{result.totalProcessed}</span>
                </p>
              </div>
            </div>
          </div>

          {result.records.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="font-semibold text-slate-100">Processed employees</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Employee</th>
                      <th className="px-5 py-3 text-right font-medium">Gross</th>
                      <th className="px-5 py-3 text-right font-medium">Deductions</th>
                      <th className="px-5 py-3 text-right font-medium">Net pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.map((r, i) => (
                      <tr key={r.id ?? i} className="border-t border-white/10 hover:bg-white/5">
                        <td className="px-5 py-3 font-medium text-slate-100">{r.employeeName}</td>
                        <td className="px-5 py-3 text-right text-slate-300">{formatMoney(r.gross)}</td>
                        <td className="px-5 py-3 text-right text-red-300">{formatMoney(r.deductions)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-300">
                          {formatMoney(r.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
