"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Alert from "../Alert.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { getEmployees } from "../../../../services/tintu/employeeService.js";
import { callApi } from "../../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../../services/tintu/utils/getErrorMessage.js";

// The API does not send department/designation yet, so show "—" until it does.
const text = (v) => (typeof v === "object" && v !== null ? v.name : v) || "—";

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await callApi(() => getEmployees());
    if (result.ok) {
      const d = result.data;
      setEmployees(Array.isArray(d) ? d : d?.content ?? []);
    } else if (result.status === 401 || result.status === 403) {
      setError("Access denied. Please login again.");
    } else {
      setError(getErrorMessage(result));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const rows = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        code: e.employeeCode || "—",
        name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || "—",
        email: e.email || "",
        department: text(e.department),
        designation: text(e.designation),
        status: e.status || "—",
      })),
    [employees]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.code, r.name, r.email, r.department, r.designation, r.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  return (
    <div className="rounded-2xl bg-[#111833] p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Employee Directory</h1>
          <p className="text-sm text-slate-400">View and manage all employees.</p>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID, name, department, status..."
          className="w-full rounded-lg border border-white/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 sm:w-80"
        />
      </div>

      <Alert type="error" message={error} />
      {error && (
        <button
          onClick={loadEmployees}
          className="mb-4 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-white/10"
        >
          Try again
        </button>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0f1a2e] text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Loading employees...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <p className="text-4xl">📭</p>
                  <p className="mt-2 font-semibold text-slate-300">No Employees Found</p>
                  <p className="text-sm text-slate-400">
                    {query
                      ? "Try a different search word."
                      : error
                      ? "We could not load the list."
                      : "Employees you add will appear here."}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-300">
                    {r.code}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.department}</td>
                  <td className="px-4 py-3 text-slate-300">{r.designation}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/employees/${r.id}`}
                      className="mr-2 rounded-lg bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/15"
                    >
                      View
                    </Link>
                    <Link href={`/employees/${r.id}/edit`}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
                    >
                      Edit
                    </Link>
                    <Link href={`/employees/${r.id}/documents`}
  className="ml-2 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300 hover:bg-green-500/20"
>
  Docs
</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Showing {filtered.length} of {rows.length} employees
        </p>
      )}
    </div>
  );
}