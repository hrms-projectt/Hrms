"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import ShiftFormModal from "../components/ShiftFormModal";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Coffee,
  CalendarOff,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  DAYS,
  getShifts,
  deleteShift,
  workingMinutes,
  formatDuration,
  formatTime12,
  isOvernight,
} from "@/services/shiftService";

const ALLOWED_ROLES = ["SUPER_ADMIN", "HR_ADMIN"];

export default function ShiftsPage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [modal, setModal] = useState(null); // "new" | shift object | null
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  // load shifts
  useEffect(() => {
    if (!allowed) return;
    getShifts()
      .then(setShifts)
      .catch((err) => setError(err.message || "Could not load shifts"))
      .finally(() => setLoading(false));
  }, [allowed]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // after create / edit: close the form, reload the list, show a message
  const handleSaved = async (message) => {
    setModal(null);
    showToast(message);
    try {
      setShifts(await getShifts());
    } catch (err) {
      setError(err.message || "Could not reload shifts");
    }
  };

  const handleDelete = async (shift) => {
    setDeleting(true);
    setError("");
    try {
      await deleteShift(shift.id);
      setShifts((list) => list.filter((s) => s.id !== shift.id));
      showToast(`${shift.name} deleted`);
    } catch (err) {
      setError(err.message || "Could not delete the shift");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
            Shift Management
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Create and edit work shifts with their break and weekly off days.
          </p>
        </div>

        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          <Plus size={16} />
          Create Shift
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 h-5 w-32 animate-pulse rounded-lg bg-white/10" />
              <div className="mb-3 h-8 w-48 animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-40 animate-pulse rounded-lg bg-white/10" />
            </div>
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
          <Clock size={36} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-500">No shifts yet.</p>
          <button
            onClick={() => setModal("new")}
            className="mt-4 rounded-full bg-sky-500/15 px-5 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/25"
          >
            Create the first shift
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shifts.map((s) => {
            const total = workingMinutes(s.startTime, s.endTime, s.breakMinutes);
            const off = DAYS.filter((d) => s.weeklyOffDays.includes(d.key));

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="truncate text-lg font-semibold text-slate-100">
                    {s.name}
                  </h2>
                  {isOvernight(s.startTime, s.endTime) && (
                    <span className="shrink-0 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-medium text-orange-400">
                      Night
                    </span>
                  )}
                </div>

                <p className="flex items-center gap-2 text-2xl font-semibold text-sky-400">
                  <Clock size={20} className="shrink-0" />
                  <span className="text-base sm:text-lg">
                    {formatTime12(s.startTime)} - {formatTime12(s.endTime)}
                  </span>
                </p>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <Coffee size={15} className="text-slate-500" />
                    {s.breakMinutes} min break
                    <span className="text-slate-500">
                      ({formatDuration(total)} of work)
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <CalendarOff size={15} className="text-slate-500" />
                    {off.length === 0 ? (
                      <span className="text-slate-500">No weekly off</span>
                    ) : (
                      off.map((d) => (
                        <span
                          key={d.key}
                          className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-300"
                        >
                          {d.short}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  {confirmId === s.id ? (
                    <div className="flex items-center gap-3">
                      <p className="flex-1 text-sm text-orange-300">Delete this shift?</p>
                      <button
                        onClick={() => handleDelete(s)}
                        disabled={deleting}
                        className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                      >
                        {deleting ? "Deleting..." : "Yes, delete"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        disabled={deleting}
                        className="rounded-full bg-slate-700/40 px-4 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/70"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setModal(s)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-700/40 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700/70"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmId(s.id)}
                        className="flex items-center justify-center gap-2 rounded-full bg-red-500/15 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/25"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* create / edit form */}
      {modal && (
        <ShiftFormModal
          key={modal === "new" ? "new" : modal.id}
          shift={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Success toast */}
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
