"use client";

// Apply for Leave form  (Srilekha)
//   - Leave type dropdown + remaining balance of the selected type
//   - Start / end date (end date must not be before the start date)
//   - Reason, attachment (medical certificate)
//   - Sends the request to the Leave API
// After a successful request it reloads the balances and fires the "leave-changed"
// event, so the Leave History table (Tintu) reloads by itself.

import { useState, useEffect } from "react";
import { CalendarDays, Paperclip, Send, AlertCircle, Check, X } from "lucide-react";
import {
  getLeaveBalances,
  applyLeave,
  countDays,
  balanceText,
  validateLeaveForm,
  notifyLeaveChanged,
  MAX_FILE_MB,
  ALLOWED_FILE_TYPES,
} from "@/services/leaveService";

const emptyForm = { leaveTypeId: "", startDate: "", endDate: "", reason: "" };

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500";

// red message under a field
function FieldError({ text }) {
  return text ? <p className="mt-1.5 text-xs text-red-400">{text}</p> : null;
}

export default function ApplyForLeave() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBalances = () =>
    getLeaveBalances()
      .then((data) => {
        setBalances(data);
        setLoadError("");
      })
      .catch((err) => setLoadError(err.message || "Could not load your leave balance"))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadBalances();
  }, []);

  // ----- values worked out from the form -----
  const selected = balances.find((b) => String(b.id) === String(form.leaveTypeId)) || null;
  const datesOk = form.startDate && form.endDate && form.endDate >= form.startDate;
  const days = datesOk ? countDays(form.startDate, form.endDate) : 0;
  const after = selected && selected.remaining !== null && days > 0 ? selected.remaining - days : null;

  // ----- handlers -----
  const change = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    setSuccess("");
    setSubmitError("");

    // show the date-order message at once
    const nextErrors = { ...errors, [name]: undefined };
    if (name === "startDate" || name === "endDate") {
      nextErrors.endDate =
        next.startDate && next.endDate && next.endDate < next.startDate
          ? "End date must be after the start date."
          : undefined;
    }
    setErrors(nextErrors);
  };

  const pickFile = (e) => {
    const picked = e.target.files?.[0];
    setSuccess("");
    if (!picked) return setFile(null);

    if (!ALLOWED_FILE_TYPES.includes(picked.type)) {
      setFile(null);
      e.target.value = "";
      return setErrors((prev) => ({ ...prev, attachment: "Only PDF, JPG or PNG files are allowed." }));
    }
    if (picked.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null);
      e.target.value = "";
      return setErrors((prev) => ({ ...prev, attachment: `The file is too big. Maximum size is ${MAX_FILE_MB} MB.` }));
    }
    setErrors((prev) => ({ ...prev, attachment: undefined }));
    setFile(picked);
  };

  const removeFile = () => {
    setFile(null);
    setErrors((prev) => ({ ...prev, attachment: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setSubmitError("");

    const found = validateLeaveForm(form, selected, file);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await applyLeave({ ...form, attachment: file });
      setSuccess(`Your ${selected?.name || "leave"} request for ${days} day${days === 1 ? "" : "s"} was submitted and is waiting for approval.`);
      setForm(emptyForm);
      setFile(null);
      setErrors({});
      await loadBalances(); // balance changes after applying
      notifyLeaveChanged(); // tells the history table to reload
    } catch (err) {
      setSubmitError(err.message || "Could not submit the leave request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-full border-2 border-[#2a8fd0] p-2">
          <CalendarDays size={22} className="text-sky-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Apply for Leave</h2>
          <p className="text-sm text-slate-400">Choose the leave type and the dates. Your manager will approve it.</p>
        </div>
      </div>

      {loadError && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {loadError}
        </div>
      )}

      {/* balance of every leave type (click one to select it) */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/10" />
            ))
          : balances.map((b) => {
              const active = String(b.id) === String(form.leaveTypeId);
              const percent = b.total ? Math.min(100, Math.round((b.used / b.total) * 100)) : 0;
              const low = b.remaining !== null && b.remaining <= 2;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, leaveTypeId: String(b.id) }))}
                  className={`rounded-xl border p-4 text-left transition hover:border-sky-500/40 ${
                    active ? "border-sky-500/50 bg-sky-500/10" : "border-white/10 bg-slate-900/40"
                  }`}
                >
                  <p className="text-sm text-slate-300">{b.name}</p>
                  <p className={`mt-1 text-2xl font-semibold ${low ? "text-orange-400" : "text-slate-100"}`}>
                    {b.remaining === null ? "Unlimited" : b.remaining}
                    {b.remaining !== null && <span className="ml-1 text-sm font-normal text-slate-500">days left</span>}
                  </p>
                  {b.total !== null && (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                      <div className="h-1.5 rounded-full bg-sky-400 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          {success}
        </div>
      )}

      {submitError && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid gap-5 md:grid-cols-2">
        {/* leave type */}
        <div className="md:col-span-2">
          <label htmlFor="leaveTypeId" className="mb-1.5 block text-xs text-slate-400">Leave type</label>
          <select
            id="leaveTypeId"
            name="leaveTypeId"
            value={form.leaveTypeId}
            onChange={change}
            disabled={loading}
            className={inputClass}
          >
            <option value="">{loading ? "Loading leave types..." : "Select a leave type"}</option>
            {balances.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900">
                {b.name} ({balanceText(b)})
              </option>
            ))}
          </select>
          <FieldError text={errors.leaveTypeId} />
          {selected && (
            <p className="mt-1.5 text-xs text-sky-300">
              Remaining balance for {selected.name}:{" "}
              <strong>{selected.remaining === null ? "Unlimited" : `${selected.remaining} day${selected.remaining === 1 ? "" : "s"}`}</strong>
              {selected.total !== null && ` (used ${selected.used} of ${selected.total})`}
            </p>
          )}
        </div>

        {/* dates */}
        <div>
          <label htmlFor="startDate" className="mb-1.5 block text-xs text-slate-400">Start date</label>
          <input id="startDate" type="date" name="startDate" value={form.startDate} onChange={change} className={inputClass} />
          <FieldError text={errors.startDate} />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1.5 block text-xs text-slate-400">End date</label>
          <input
            id="endDate"
            type="date"
            name="endDate"
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={change}
            className={inputClass}
          />
          <FieldError text={errors.endDate} />
        </div>

        {/* summary of the request */}
        {days > 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-300 md:col-span-2">
            You are asking for{" "}
            <span className="font-semibold text-slate-100">
              {days} day{days === 1 ? "" : "s"}
            </span>
            {selected && after !== null && (
              <>
                {". Balance after this leave: "}
                <span className={`font-semibold ${after < 0 ? "text-red-400" : "text-slate-100"}`}>
                  {after} day{Math.abs(after) === 1 ? "" : "s"}
                </span>
              </>
            )}
            .
          </div>
        )}

        {/* reason */}
        <div className="md:col-span-2">
          <label htmlFor="reason" className="mb-1.5 flex justify-between text-xs text-slate-400">
            <span>Reason</span>
            <span className={form.reason.length > 500 ? "text-red-400" : ""}>{form.reason.length}/500</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            value={form.reason}
            onChange={change}
            placeholder="Why do you need this leave?"
            className={`${inputClass} resize-none`}
          />
          <FieldError text={errors.reason} />
        </div>

        {/* attachment */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs text-slate-400">
            Attachment{" "}
            {selected?.requiresAttachment ? (
              <span className="text-orange-400">(medical certificate required)</span>
            ) : (
              "(optional)"
            )}
          </label>

          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2.5 text-sm text-slate-200">
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip size={15} className="shrink-0 text-slate-500" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-slate-500">({(file.size / 1024).toFixed(0)} KB)</span>
              </span>
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove attachment"
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={pickFile}
              className="w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-300 hover:file:bg-sky-500/25"
            />
          )}
          <p className="mt-1.5 text-xs text-slate-500">PDF, JPG or PNG, up to {MAX_FILE_MB} MB.</p>
          <FieldError text={errors.attachment} />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting || loading}
            className="flex items-center gap-2 rounded-full bg-sky-500 px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            <Send size={15} />
            {submitting ? "Submitting..." : "Submit leave request"}
          </button>
        </div>
      </form>
    </section>
  );
}
