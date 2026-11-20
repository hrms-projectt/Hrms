"use client";

import { useState, useEffect } from "react";
import { X, Clock, ChevronDown, Check } from "lucide-react";
import {
  DAYS,
  createShift,
  updateShift,
  workingMinutes,
  formatDuration,
  formatTime12,
  isOvernight,
} from "@/services/shiftService";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500";

// ---------- Weekly off: dropdown with tick boxes ----------
function WeeklyOffDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (key) =>
    onChange(value.includes(key) ? value.filter((d) => d !== key) : [...value, key]);

  const labelOf = (key) => DAYS.find((d) => d.key === key)?.short;
  // keep Sun..Sat order in the label
  const selected = DAYS.filter((d) => value.includes(d.key)).map((d) => d.short);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${inputClass} flex items-center justify-between text-left`}
        aria-expanded={open}
      >
        <span className={selected.length ? "text-slate-100" : "text-slate-500"}>
          {selected.length ? selected.join(", ") : "Select weekly off days"}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-white/10 bg-slate-900/40 p-2">
          {DAYS.map((d) => {
            const checked = value.includes(d.key);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => toggle(d.key)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    checked
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "border-white/20"
                  }`}
                >
                  {checked && <Check size={13} strokeWidth={3} />}
                </span>
                {d.key.charAt(0) + d.key.slice(1).toLowerCase()}
                <span className="ml-auto text-xs text-slate-500">{d.short}</span>
              </button>
            );
          })}

          <div className="mt-1 flex gap-2 border-t border-white/10 px-1 pt-2">
            <button
              type="button"
              onClick={() => onChange(["SATURDAY", "SUNDAY"])}
              className="rounded-full bg-slate-700/40 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700/70"
            >
              Sat + Sun
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-full bg-slate-700/40 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700/70"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-500/25"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* chips under the dropdown */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value
            .slice()
            .sort((a, b) => DAYS.findIndex((d) => d.key === a) - DAYS.findIndex((d) => d.key === b))
            .map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-300"
              >
                {labelOf(key)}
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-label={`Remove ${labelOf(key)}`}
                  className="text-sky-300/70 hover:text-sky-200"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

// ---------- Create / edit form ----------
// shift = null  -> create    |   shift = {...} -> edit
export default function ShiftFormModal({ shift, onClose, onSaved }) {
  const editing = Boolean(shift);

  const [form, setForm] = useState({
    name: shift?.name || "",
    startTime: shift?.startTime || "09:00",
    endTime: shift?.endTime || "18:00",
    breakMinutes: shift ? String(shift.breakMinutes) : "60",
    weeklyOffDays: shift?.weeklyOffDays || ["SUNDAY"],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // close with the Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const total = workingMinutes(form.startTime, form.endTime, form.breakMinutes);
  const overnight = isOvernight(form.startTime, form.endTime);

  const validate = () => {
    if (form.name.trim().length < 2) return "Shift name must be at least 2 characters.";
    if (!form.startTime || !form.endTime) return "Please choose the start and end time.";
    if (form.startTime === form.endTime) return "Start and end time cannot be the same.";
    const brk = Number(form.breakMinutes);
    if (!Number.isInteger(brk) || brk < 0 || brk > 240)
      return "Break must be a whole number between 0 and 240 minutes.";
    const span = workingMinutes(form.startTime, form.endTime, 0);
    if (brk >= span) return "The break must be shorter than the shift.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateShift(shift.id, form);
      } else {
        await createShift(form);
      }
      await onSaved(editing ? `${form.name.trim()} updated` : `${form.name.trim()} created`);
    } catch (err) {
      setError(err.message || "Could not save the shift");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1020] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full border-2 border-[#2a8fd0] p-2">
              <Clock size={18} className="text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {editing ? "Edit shift" : "Create shift"}
              </h3>
              <p className="text-sm text-slate-400">
                Set the working hours, break and weekly off days.
              </p>
            </div>
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

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Shift name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={50}
              placeholder="General Shift"
              className={inputClass}
            />
          </div>

          {/* time pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Start time</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">End time</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-slate-400">
              Break duration (minutes)
            </label>
            <input
              type="number"
              name="breakMinutes"
              value={form.breakMinutes}
              onChange={handleChange}
              required
              min={0}
              max={240}
              step={5}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Weekly off</label>
            <WeeklyOffDropdown
              value={form.weeklyOffDays}
              onChange={(days) => setForm((prev) => ({ ...prev, weeklyOffDays: days }))}
            />
          </div>

          {/* live summary */}
          {form.startTime && form.endTime && form.startTime !== form.endTime && (
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
              {formatTime12(form.startTime)} to {formatTime12(form.endTime)}
              {overnight && <span className="text-orange-400"> (next day)</span>}
              {" - "}
              <span className="font-medium text-slate-100">
                {formatDuration(total)} of work
              </span>{" "}
              after a {Number(form.breakMinutes) || 0} min break
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

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
            className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Save changes" : "Create shift"}
          </button>
        </div>
      </form>
    </div>
  );
}
