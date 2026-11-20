"use client";

import { effectiveAmount, formatMoney } from "../../../services/tintu/utils/salaryHelpers.js";

export default function SalarySection({
  title,
  headerColor,
  rows,
  currency,
  editing,
  drafts,
  resets,
  onDraft,
  onReset,
  total,
}) {
  return (
    <div className="mb-6">
      <h2 className={`mb-2 text-sm font-semibold uppercase ${headerColor}`}>{title}</h2>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0f1a2e] text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Component</th>
              <th className="px-4 py-3">How it is calculated</th>
              <th className="px-4 py-3 text-right">Calculated</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No {title.toLowerCase()} assigned.
                </td>
              </tr>
            )}

            {rows.map((r) => {
              const isReset = resets.has(r.id);
              return (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-slate-100">{r.name}</td>
                  <td className="px-4 py-3 text-slate-400">{r.rule}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-300">
                    {formatMoney(r.calculated, currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {editing ? (
                      <div className="flex items-center justify-end gap-2">
                        {r.override !== null && (
                          <button
                            type="button"
                            onClick={() => onReset(r)}
                            className="text-xs text-sky-400 hover:underline"
                          >
                            {isReset ? "Undo reset" : "Reset"}
                          </button>
                        )}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={drafts[r.id] ?? ""}
                          disabled={isReset}
                          onChange={(e) => onDraft(r.id, e.target.value)}
                          className="w-32 rounded-lg border border-white/15 px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-800"
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-100">
                        {formatMoney(effectiveAmount(r), currency)}
                        {r.override !== null && (
                          <span className="ml-2 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-300">
                            Overridden
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[#0f1a2e]">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                Total {title}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-100">
                {formatMoney(total, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}