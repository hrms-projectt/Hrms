"use client";

// S-12  Salary Structure configuration (HR / Finance Admin)
//   - add as many components as needed (Basic, HRA, PF ...)
//   - each component is a FIXED amount or a PERCENTAGE of Basic Salary
//   - the screen calculates every amount, then saves:
//       POST /payroll/components   (one call per component)
//       POST /payroll/structure    (one call for the designation)

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import { Plus, Trash2, Save, AlertCircle, Check } from "lucide-react";
import {
  PAYROLL_ROLES,
  formatMoney,
  createComponent,
  createSalaryStructure,
} from "@/services/payrollService";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500 disabled:opacity-50";

let rowCounter = 0;
const newRow = (patch = {}) => ({
  key: ++rowCounter,
  name: "",
  type: "EARNING",
  calc: "FIXED", // FIXED | PERCENT (of Basic Salary)
  value: "",
  ...patch,
});

// the first row is always the Basic Salary: the other components can be a % of it
const startRows = () => [newRow({ name: "Basic Salary" }), newRow({ name: "HRA", calc: "PERCENT", value: "40" })];

export default function SalaryStructurePage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  const [designation, setDesignation] = useState("");
  const [rows, setRows] = useState(startRows);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (PAYROLL_ROLES.includes(user.role)) setAllowed(true);
      else router.replace("/dashboard");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const basic = Number(rows[0]?.value) || 0;

  // amount of every row, worked out from the formula
  const amountOf = (r) => {
    const v = Number(r.value) || 0;
    return r.calc === "PERCENT" ? Math.round(((basic * v) / 100) * 100) / 100 : v;
  };

  const totals = useMemo(() => {
    const sum = (type) =>
      rows.filter((r) => r.type === type).reduce((t, r) => t + amountOf(r), 0);
    const earnings = sum("EARNING");
    const deductions = sum("DEDUCTION");
    return { earnings, deductions, net: earnings - deductions };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const update = (key, patch) => {
    setToast("");
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows((list) => [...list, newRow()]);
  const removeRow = (key) => setRows((list) => list.filter((r) => r.key !== key));

  const validate = () => {
    const list = [];
    if (!designation.trim()) list.push("Please enter the designation.");
    if (rows.length === 0) list.push("Add at least one component.");

    const names = new Set();
    rows.forEach((r, i) => {
      const label = r.name.trim() || `Row ${i + 1}`;
      if (!r.name.trim()) list.push(`Row ${i + 1}: component name is required.`);
      else if (names.has(r.name.trim().toLowerCase())) list.push(`"${r.name.trim()}" is added twice.`);
      names.add(r.name.trim().toLowerCase());

      const v = Number(r.value);
      if (r.value === "" || Number.isNaN(v) || v < 0) list.push(`${label}: enter a valid value.`);
      else if (r.calc === "PERCENT" && v > 100) list.push(`${label}: a percentage cannot be more than 100.`);
      if (i === 0 && r.calc === "PERCENT") list.push("The first row (Basic Salary) must be a fixed amount.");
      if (i === 0 && r.type !== "EARNING") list.push("The first row (Basic Salary) must be an earning.");
    });
    if (totals.earnings <= 0) list.push("Total earnings must be more than 0.");
    if (totals.deductions > totals.earnings) list.push("Deductions are more than earnings.");
    return list;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const list = validate();
    setErrors(list);
    if (list.length > 0) return;

    setSaving(true);
    try {
      // 1) every component definition
      for (const r of rows) {
        try {
          await createComponent({
            name: r.name.trim(),
            type: r.type,
            calculationType: r.calc === "PERCENT" ? "PERCENTAGE" : "FIXED",
            defaultValue: Number(r.value),
          });
        } catch (err) {
          // a component that already exists is fine, the structure can still use it
          if (!/exist|duplicate|already/i.test(err.message || "")) throw err;
        }
      }

      // 2) the salary structure of the designation  { "Basic Salary": 18000, ... }
      const components = {};
      rows.forEach((r) => {
        components[r.name.trim()] = amountOf(r);
      });
      await createSalaryStructure({
        designation: designation.trim(),
        totalEarnings: totals.earnings,
        components,
      });

      setToast(`Salary structure of ${designation.trim()} saved`);
      setTimeout(() => setToast(""), 3500);
      setDesignation("");
      setRows(startRows());
    } catch (err) {
      setErrors([err.message || "Could not save the salary structure"]);
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Salary Structure
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Define the salary components of a designation. A component is a fixed amount or a
          percentage of the Basic Salary (for example HRA = 40% of Basic).
        </p>
      </div>

      {errors.length > 0 && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <p className="mb-1 flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0" />
            Please fix this:
          </p>
          <ul className="ml-6 list-disc space-y-0.5">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {/* ---------- components ---------- */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-5 max-w-sm">
            <label htmlFor="designation" className="mb-1.5 block text-xs text-slate-400">
              Designation <span className="text-red-400">*</span>
            </label>
            <input
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Software Engineer"
              disabled={saving}
              className={inputClass}
            />
          </div>

          <div className="mb-2 hidden grid-cols-[1.4fr_1fr_1fr_1fr_1fr_40px] gap-3 px-1 text-xs uppercase tracking-wide text-slate-500 md:grid">
            <span>Component</span>
            <span>Type</span>
            <span>Calculation</span>
            <span>Value</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          <div className="space-y-3">
            {rows.map((r, i) => (
              <div
                key={r.key}
                className="grid items-center gap-3 rounded-xl border border-white/10 bg-slate-900/30 p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_40px] md:border-0 md:bg-transparent md:p-0"
              >
                <input
                  value={r.name}
                  onChange={(e) => update(r.key, { name: e.target.value })}
                  placeholder="Component name"
                  aria-label="Component name"
                  disabled={saving}
                  className={inputClass}
                />
                <select
                  value={r.type}
                  onChange={(e) => update(r.key, { type: e.target.value })}
                  aria-label="Type"
                  disabled={saving || i === 0}
                  className={inputClass}
                >
                  <option value="EARNING" className="bg-slate-900">Earning</option>
                  <option value="DEDUCTION" className="bg-slate-900">Deduction</option>
                </select>
                <select
                  value={r.calc}
                  onChange={(e) => update(r.key, { calc: e.target.value })}
                  aria-label="Calculation"
                  disabled={saving || i === 0}
                  className={inputClass}
                >
                  <option value="FIXED" className="bg-slate-900">Fixed amount</option>
                  <option value="PERCENT" className="bg-slate-900">% of Basic</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={r.value}
                  onChange={(e) => update(r.key, { value: e.target.value })}
                  placeholder={r.calc === "PERCENT" ? "e.g. 40" : "e.g. 18000"}
                  aria-label="Value"
                  disabled={saving}
                  className={inputClass}
                />
                <p
                  className={`text-sm font-medium md:text-right ${
                    r.type === "DEDUCTION" ? "text-red-300" : "text-green-300"
                  }`}
                >
                  {r.type === "DEDUCTION" ? "- " : ""}
                  {formatMoney(amountOf(r))}
                </p>
                <button
                  type="button"
                  onClick={() => removeRow(r.key)}
                  disabled={saving || i === 0}
                  title={i === 0 ? "Basic Salary is required" : "Remove"}
                  aria-label="Remove component"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={saving}
            className="mt-4 flex items-center gap-2 rounded-full bg-slate-700/40 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700/70 disabled:opacity-50"
          >
            <Plus size={16} />
            Add component
          </button>
        </div>

        {/* ---------- summary ---------- */}
        <div className="h-fit rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500">
            Summary {designation.trim() && `· ${designation.trim()}`}
          </p>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between text-slate-300">
              <span>Total earnings</span>
              <span className="font-semibold text-green-300">{formatMoney(totals.earnings)}</span>
            </p>
            <p className="flex justify-between text-slate-300">
              <span>Total deductions</span>
              <span className="font-semibold text-red-300">{formatMoney(totals.deductions)}</span>
            </p>
            <p className="flex justify-between border-t border-white/10 pt-3 text-slate-100">
              <span className="font-medium">Net pay</span>
              <span className="text-lg font-semibold">{formatMoney(totals.net)}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save salary structure"}
          </button>
        </div>
      </form>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 rounded-xl border border-green-500/30 bg-[#0f1a2e] px-4 py-3 text-sm text-green-300 shadow-xl">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </MainLayout>
  );
}
