"use client";

import { useEffect, useState } from "react";
import { getEntryAuditLog } from "../../../services/tintu/payrollDraftService.js";
import { normalizeEntryAudit } from "../../../services/tintu/utils/payrollDraftHelpers.js";
import { formatDateTime, formatMoney } from "../../../services/tintu/utils/salaryHelpers.js";
import { callApi } from "../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../services/tintu/utils/getErrorMessage.js";

const isSet = (v) => v !== null && v !== undefined && v !== "";

export default function PayrollAuditModal({ batchId, row, currency, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rowId = row?.id;

  useEffect(() => {
    if (rowId === undefined) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await callApi(() => getEntryAuditLog(batchId, rowId));
      if (cancelled) return;
      if (res.ok) setEntries(normalizeEntryAudit(res.data));
      else {
        setEntries([]);
        setError(getErrorMessage(res));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId, rowId]);

  if (!row) return null;

  // "₹10,000.00 → ₹12,000.00"
  const change = (oldV, newV) =>
    isSet(oldV) || isSet(newV)
      ? `${formatMoney(oldV, currency)} → ${formatMoney(newV, currency)}`
      : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-[#111833] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Audit Log</h2>
            <p className="text-sm text-slate-400">
              {row.name}
              {row.code && ` · ${row.code}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Close
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0f1a2e] text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Pay</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading audit log...
                  </td>
                </tr>
              )}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No changes recorded for this employee.
                  </td>
                </tr>
              )}
              {!loading &&
                entries.map((a) => (
                  <tr key={a.key}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {formatDateTime(a.changedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          a.action === "RECALCULATED"
                            ? "bg-sky-500/15 text-sky-300"
                            : "bg-orange-500/15 text-orange-300"
                        }`}
                      >
                        {a.action.charAt(0) + a.action.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {change(a.oldGross, a.newGross)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {change(a.oldDeductions, a.newDeductions)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-100">
                      {change(a.oldNet, a.newNet)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{a.reason || "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{a.changedBy}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}