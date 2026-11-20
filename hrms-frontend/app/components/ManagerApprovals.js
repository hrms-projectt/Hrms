"use client";

// Manager Approval Dashboard  (Srilekha, task S-11)
//   - lists the leave requests of the logged-in manager's TEAM only
//     (the server filters them; this screen never sends or filters by team)
//   - Approve  -> calls the API, shows a success toast
//   - Reject   -> opens a modal to enter the reason, then calls the API
//   - click an employee -> side panel with the full request and a comment box
// After every decision it fires the "approvals-changed" event so the team
// calendar (Tintu) reloads.

import { useState, useEffect } from "react";
import {
  Check,
  X,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Paperclip,
  AlertCircle,
  CalendarDays,
  Mail,
} from "lucide-react";
import {
  getManagerTeam,
  getTeamLeaveRequests,
  approveLeave,
  rejectLeave,
  notifyApprovalsChanged,
  REQUEST_STATUSES,
  formatDate,
} from "@/services/managerService";

const TABS = [
  { key: "PENDING", label: "Pending approvals" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const overlaps = (a, b) => a.startDate <= b.endDate && b.startDate <= a.endDate;

// ---------- modal: reason for rejecting ----------
function RejectModal({ request, initialReason = "", onClose, onConfirm }) {
  const [reason, setReason] = useState(initialReason);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const submit = async (e) => {
    e.preventDefault();
    const text = reason.trim();
    if (text.length < 5) return setError("Please enter a reason (at least 5 characters).");
    if (text.length > 300) return setError("The reason is too long (maximum 300 characters).");

    setSaving(true);
    setError("");
    try {
      await onConfirm(text);
    } catch (err) {
      setError(err.message || "Could not reject the request");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Reject leave request</h3>
            <p className="mt-1 text-sm text-slate-400">
              {request.employeeName}: {request.leaveType}, {formatDate(request.startDate)}
              {request.endDate !== request.startDate && ` to ${formatDate(request.endDate)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label htmlFor="reject-reason" className="mb-2 flex justify-between text-sm text-slate-300">
          <span>
            Reason for rejecting <span className="text-red-400">*</span>
          </span>
          <span className="text-xs text-slate-500">{reason.length}/300</span>
        </label>
        <textarea
          id="reject-reason"
          rows={4}
          autoFocus
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          disabled={saving}
          placeholder="e.g. The team has a release deadline on these dates."
          className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full bg-slate-700/40 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700/70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
          >
            {saving ? "Rejecting..." : "Reject request"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ManagerApprovals() {
  const [team, setTeam] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [tab, setTab] = useState("PENDING");
  const [busyId, setBusyId] = useState(null); // request being approved
  const [selectedId, setSelectedId] = useState(null); // side panel
  const [comment, setComment] = useState(""); // comment box in the side panel
  const [rejecting, setRejecting] = useState(null); // { request, initialReason }

  useEffect(() => {
    Promise.all([getManagerTeam(), getTeamLeaveRequests()])
      .then(([teamData, requestData]) => {
        setTeam(teamData);
        setRequests(requestData);
      })
      .catch((err) => setError(err.message || "Could not load your team's requests"))
      .finally(() => setLoading(false));
  }, []);

  // close the side panel with the Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !rejecting) setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rejecting]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const count = (status) => requests.filter((r) => r.status === status).length;
  const shown = requests.filter((r) => r.status === tab);
  const selected = requests.find((r) => r.id === selectedId) || null;

  const patch = (id, changes) =>
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  // ----- Approve: calls the API at once, then a success toast -----
  const handleApprove = async (request, note = "") => {
    setBusyId(request.id);
    setError("");
    try {
      await approveLeave(request.id, note);
      patch(request.id, { status: "APPROVED", managerComment: note.trim() });
      showToast(`Leave approved for ${request.employeeName}`);
      setSelectedId(null);
      setComment("");
      notifyApprovalsChanged();
    } catch (err) {
      setError(err.message || "Could not approve the request");
    } finally {
      setBusyId(null);
    }
  };

  // ----- Reject: called by the modal with the reason -----
  const handleReject = async (reason) => {
    const request = rejecting.request;
    await rejectLeave(request.id, reason);
    patch(request.id, { status: "REJECTED", managerComment: reason });
    setRejecting(null);
    setSelectedId(null);
    setComment("");
    showToast(`Leave rejected for ${request.employeeName}`);
    notifyApprovalsChanged();
  };

  // people in the team who also have leave on the same dates
  const overlapping = selected
    ? requests.filter(
        (o) => o.id !== selected.id && ["APPROVED", "PENDING"].includes(o.status) && overlaps(selected, o)
      )
    : [];

  const cards = [
    { label: "Pending approvals", value: count("PENDING"), icon: Clock, style: "bg-yellow-500/15 text-yellow-400" },
    { label: "Approved", value: count("APPROVED"), icon: CheckCircle2, style: "bg-green-500/15 text-green-400" },
    { label: "Rejected", value: count("REJECTED"), icon: XCircle, style: "bg-red-500/15 text-red-400" },
    { label: "Team members", value: team.length, icon: Users, style: "bg-sky-500/15 text-sky-400" },
  ];

  return (
    <section className="mb-8">
      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
              <div>
                <p className="text-sm text-slate-400">{c.label}</p>
                <p className="mt-1 text-3xl font-semibold text-slate-100">{loading ? "..." : c.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.style}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* who reports to this manager */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Your team ({loading ? "..." : team.length}). Only these people appear below.
        </p>
        <div className="flex flex-wrap gap-2">
          {loading && <div className="h-7 w-40 animate-pulse rounded-full bg-white/10" />}
          {team.map((m) => (
            <span
              key={m.id}
              title={[m.code, m.designation].filter(Boolean).join(" · ")}
              className="inline-flex items-center gap-2 rounded-full bg-slate-700/40 px-3 py-1 text-xs font-medium text-slate-200"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-sky-300">
                {m.name.charAt(0)}
              </span>
              {m.name}
            </span>
          ))}
          {!loading && team.length === 0 && (
            <span className="text-sm text-slate-500">No one reports to you yet.</span>
          )}
        </div>
      </div>

      {/* table */}
      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-5 py-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t.key ? "bg-sky-500/20 text-sky-300" : "bg-slate-700/40 text-slate-400 hover:text-white"
              }`}
            >
              {t.label} ({loading ? "..." : count(t.key)})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Leave type</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                {tab === "PENDING" ? (
                  <>
                    <th className="px-5 py-3 font-medium">Applied on</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Your comment</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {loading &&
                [0, 1, 2].map((i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-9 w-full animate-pulse rounded-lg bg-white/10" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                shown.map((r) => {
                  const status = REQUEST_STATUSES.find((s) => s.key === r.status);
                  return (
                    <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(r.id);
                            setComment("");
                          }}
                          className="flex items-center gap-3 text-left"
                          title="Open details"
                        >
                          <span className="rounded-full border-2 border-[#2a8fd0] p-0.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-sky-300">
                              {r.employeeName.charAt(0)}
                            </span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-100 hover:text-sky-300">{r.employeeName}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {[r.employeeCode, r.department].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-slate-200">
                        {r.leaveType}
                        {r.attachmentName && (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                            <Paperclip size={11} />
                            {r.attachmentName}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-300">
                        {formatDate(r.startDate)}
                        {r.endDate !== r.startDate && ` - ${formatDate(r.endDate)}`}
                        <p className="text-[11px] text-slate-500">
                          {r.days} day{r.days === 1 ? "" : "s"}
                        </p>
                      </td>

                      <td className="max-w-[220px] px-5 py-3.5 text-slate-300">
                        <p className="truncate" title={r.reason}>{r.reason}</p>
                      </td>

                      {tab === "PENDING" ? (
                        <>
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-400">{formatDate(r.appliedOn)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprove(r)}
                                disabled={busyId === r.id}
                                className="flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-green-400 disabled:opacity-50"
                              >
                                <Check size={14} strokeWidth={3} />
                                {busyId === r.id ? "Approving..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejecting({ request: r, initialReason: "" })}
                                disabled={busyId === r.id}
                                className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-4 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                              >
                                <X size={14} strokeWidth={3} />
                                Reject
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status?.badge}`}>
                              {status?.label || r.status}
                            </span>
                          </td>
                          <td className="max-w-[200px] px-5 py-3.5 text-slate-400">
                            <p className="truncate" title={r.managerComment}>{r.managerComment || "-"}</p>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}

              {!loading && shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-500">
                    {tab === "PENDING"
                      ? "No pending approvals. You are all caught up."
                      : `No ${tab.toLowerCase()} requests yet.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* side panel: full request + comment box */}
      {selected && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0b1020] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full border-2 border-[#2a8fd0] p-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-xl font-semibold text-sky-300">
                    {selected.employeeName.charAt(0)}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{selected.employeeName}</h2>
                  <p className="text-sm text-sky-400">{[selected.employeeCode, selected.department].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="flex items-center gap-3 text-slate-300">
                <CalendarDays size={16} className="text-slate-500" />
                {selected.leaveType}: {formatDate(selected.startDate)}
                {selected.endDate !== selected.startDate && ` to ${formatDate(selected.endDate)}`} ({selected.days} day
                {selected.days === 1 ? "" : "s"})
              </p>
              <p className="flex items-start gap-3 text-slate-300">
                <Mail size={16} className="mt-0.5 shrink-0 text-slate-500" />
                <span>{selected.reason || "No reason given"}</span>
              </p>
              {selected.attachmentName && (
                <p className="flex items-center gap-3 text-slate-300">
                  <Paperclip size={16} className="text-slate-500" />
                  {selected.attachmentUrl ? (
                    <a href={selected.attachmentUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                      {selected.attachmentName}
                    </a>
                  ) : (
                    selected.attachmentName
                  )}
                </p>
              )}
              <p className="text-xs text-slate-500">Applied on {formatDate(selected.appliedOn)}</p>
            </div>

            {overlapping.length > 0 && (
              <div className="mb-5 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-300">
                <p className="mb-1 font-medium">Others in your team are away on these dates:</p>
                <ul className="space-y-0.5 text-xs">
                  {overlapping.map((o) => (
                    <li key={o.id}>
                      {o.employeeName} ({o.status.toLowerCase()}): {formatDate(o.startDate)}
                      {o.endDate !== o.startDate && ` - ${formatDate(o.endDate)}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.status === "PENDING" ? (
              <>
                <label htmlFor="manager-comment" className="mb-2 block text-sm text-slate-300">
                  Comment <span className="text-xs text-slate-500">(optional for Approve, required for Reject)</span>
                </label>
                <textarea
                  id="manager-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a note for the employee"
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
                />
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleApprove(selected, comment)}
                    disabled={busyId === selected.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400 disabled:opacity-50"
                  >
                    <Check size={16} strokeWidth={3} />
                    {busyId === selected.id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejecting({ request: selected, initialReason: comment })}
                    disabled={busyId === selected.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500/15 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                  >
                    <X size={16} strokeWidth={3} />
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Decision</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    REQUEST_STATUSES.find((s) => s.key === selected.status)?.badge
                  }`}
                >
                  {REQUEST_STATUSES.find((s) => s.key === selected.status)?.label || selected.status}
                </span>
                {selected.managerComment && <p className="mt-3 text-slate-300">{selected.managerComment}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* reject modal */}
      {rejecting && (
        <RejectModal
          request={rejecting.request}
          initialReason={rejecting.initialReason}
          onClose={() => setRejecting(null)}
          onConfirm={handleReject}
        />
      )}

      {/* success toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 rounded-xl border border-green-500/30 bg-[#0f1a2e] px-4 py-3 text-sm text-green-300 shadow-xl">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </section>
  );
}
