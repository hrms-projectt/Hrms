"use client";

// ============================================================================
// TEMPORARY STAND-IN for Tintu's  LeaveHistory  component.
// It follows the same contract, so the page works today.
// When Tintu sends his real file, REPLACE THIS WHOLE FILE with his.
//
// Contract (no props, used as  <LeaveHistory />):
//   - loads the logged-in employee's requests with  getLeaveHistory()
//   - reloads when the "leave-changed" event fires (after a new request)
//   - each request: { id, leaveType, startDate, endDate, days, reason,
//       status (PENDING | APPROVED | REJECTED | CANCELLED), appliedOn,
//       attachmentName, managerComment }
// ============================================================================

import { useState, useEffect } from "react";
import { Paperclip, AlertCircle } from "lucide-react";
import { getLeaveHistory, formatDate, LEAVE_STATUSES } from "@/services/leaveService";

export default function LeaveHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    const load = () =>
      getLeaveHistory()
        .then((data) => {
          if (!active) return;
          setRequests(data);
          setError("");
        })
        .catch((err) => active && setError(err.message || "Could not load your leave history"))
        .finally(() => active && setLoading(false));

    load();
    window.addEventListener("leave-changed", load); // reload after a new request
    return () => {
      active = false;
      window.removeEventListener("leave-changed", load);
    };
  }, []);

  const shown = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
  const count = (key) => requests.filter((r) => r.status === key).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <h2 className="font-semibold text-slate-100">
          Leave History <span className="text-sm font-normal text-slate-500">({loading ? "..." : requests.length})</span>
        </h2>

        <div className="flex flex-wrap gap-2">
          {[{ key: "ALL", label: "All" }, ...LEAVE_STATUSES].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilter(s.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === s.key ? "bg-sky-500/20 text-sky-300" : "bg-slate-700/40 text-slate-400 hover:text-white"
              }`}
            >
              {s.label} ({s.key === "ALL" ? requests.length : count(s.key)})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="m-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">Leave type</th>
              <th className="px-5 py-3 font-medium">From</th>
              <th className="px-5 py-3 font-medium">To</th>
              <th className="px-5 py-3 font-medium">Days</th>
              <th className="px-5 py-3 font-medium">Reason</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Applied on</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2].map((i) => (
                <tr key={i} className="border-t border-white/10">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-8 w-full animate-pulse rounded-lg bg-white/10" />
                  </td>
                </tr>
              ))}

            {!loading &&
              shown.map((r) => {
                const status = LEAVE_STATUSES.find((s) => s.key === r.status);
                return (
                  <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-5 py-3.5 font-medium text-slate-100">
                      {r.leaveType}
                      {r.attachmentName && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-normal text-slate-500">
                          <Paperclip size={11} />
                          {r.attachmentName}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-300">{formatDate(r.startDate)}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-300">{formatDate(r.endDate)}</td>
                    <td className="px-5 py-3.5 text-slate-300">{r.days}</td>
                    <td className="max-w-xs px-5 py-3.5 text-slate-300">
                      <p className="truncate" title={r.reason}>{r.reason}</p>
                      {r.managerComment && (
                        <p className="mt-0.5 truncate text-[11px] text-slate-500" title={r.managerComment}>
                          Manager: {r.managerComment}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          status ? status.badge : "bg-slate-700/40 text-slate-300"
                        }`}
                      >
                        {status ? status.label : r.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">{formatDate(r.appliedOn)}</td>
                  </tr>
                );
              })}

            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                  {requests.length === 0 ? "You have not applied for any leave yet." : "No requests with this status."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
