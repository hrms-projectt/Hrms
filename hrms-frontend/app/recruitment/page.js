"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import {
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  GripVertical,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  getCandidates,
  updateCandidateStatus,
} from "@/services/recruitmentService";

// the four columns of the board
const STAGES = [
  {
    key: "APPLIED",
    title: "Applied",
    dot: "bg-sky-400",
    badge: "bg-sky-500/15 text-sky-400",
    over: "border-sky-400/60 bg-sky-500/10",
  },
  {
    key: "SCREENING",
    title: "Screening",
    dot: "bg-yellow-400",
    badge: "bg-yellow-500/15 text-yellow-400",
    over: "border-yellow-400/60 bg-yellow-500/10",
  },
  {
    key: "INTERVIEW",
    title: "Interview",
    dot: "bg-orange-400",
    badge: "bg-orange-500/15 text-orange-400",
    over: "border-orange-400/60 bg-orange-500/10",
  },
  {
    key: "OFFER",
    title: "Offer",
    dot: "bg-green-400",
    badge: "bg-green-500/15 text-green-400",
    over: "border-green-400/60 bg-green-500/10",
  },
];

const ALLOWED_ROLES = ["SUPER_ADMIN", "HR_ADMIN"];

export default function RecruitmentPage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [draggedId, setDraggedId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // the open candidate is always read from the list, so it stays in sync
  const selected = candidates.find((c) => c.id === selectedId) || null;

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

  // Load candidates
  useEffect(() => {
    if (!allowed) return;
    getCandidates()
      .then((data) => setCandidates(data))
      .catch((err) => setError(err.message || "Could not load candidates"))
      .finally(() => setLoading(false));
  }, [allowed]);

  // close the detail panel with the Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // Move a candidate to a new column (used by drag-and-drop AND the dropdown)
  const moveCandidate = async (id, newStatus) => {
    const current = candidates.find((c) => c.id === id);
    if (!current || current.status === newStatus) return;

    const previous = candidates;
    setError("");

    // update the screen right away
    setCandidates((list) =>
      list.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );

    try {
      await updateCandidateStatus(id, newStatus);
      const stageName = STAGES.find((s) => s.key === newStatus)?.title;
      showToast(`${current.name} moved to ${stageName}`);
    } catch (err) {
      // backend failed, put the card back
      setCandidates(previous);
      setError(err.message || "Could not update the status");
    }
  };

  // ----- drag and drop handlers -----
  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(id));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setOverColumn(null);
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault(); // required, otherwise drop does not fire
    e.dataTransfer.dropEffect = "move";
    if (overColumn !== columnKey) setOverColumn(columnKey);
  };

  const handleDrop = (e, columnKey) => {
    e.preventDefault();
    if (draggedId !== null) moveCandidate(draggedId, columnKey);
    setDraggedId(null);
    setOverColumn(null);
  };

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Recruitment
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Drag candidates between columns to update their hiring stage.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading candidates...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage) => {
            const items = candidates.filter((c) => c.status === stage.key);
            const isOver = overColumn === stage.key;

            return (
              <div
                key={stage.key}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={(e) => {
                  // ignore leave events fired by child elements
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setOverColumn(null);
                  }
                }}
                onDrop={(e) => handleDrop(e, stage.key)}
                className={`flex min-h-[320px] flex-col rounded-2xl border p-3 transition ${
                  isOver ? stage.over : "border-white/10 bg-white/5"
                }`}
              >
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
                    <h2 className="text-sm font-semibold text-slate-100">
                      {stage.title}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.badge}`}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedId(c.id)}
                      className={`cursor-grab rounded-xl border border-white/10 bg-[#111833] p-4 transition hover:border-sky-500/40 active:cursor-grabbing ${
                        draggedId === c.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full border-2 border-[#2a8fd0] p-0.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-sky-300">
                            {c.name.charAt(0)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-100">
                            {c.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {c.position}
                          </p>
                        </div>
                        <GripVertical
                          size={16}
                          className="shrink-0 text-slate-600"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Briefcase size={12} />
                          {c.experience}
                        </span>
                        <span>{c.appliedOn}</span>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-xs text-slate-600">
                      Drop a candidate here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl border border-green-500/30 bg-[#0f1a2e] px-4 py-3 text-sm text-green-300 shadow-xl">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}

      {/* Candidate detail panel */}
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0b1020] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full border-2 border-[#2a8fd0] p-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-xl font-semibold text-sky-300">
                    {selected.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    {selected.name}
                  </h2>
                  <p className="text-sm text-sky-400">{selected.position}</p>
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

            {/* Change stage (also works on phones, where dragging does not) */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Stage
              </label>
              <select
                value={selected.status}
                onChange={(e) => moveCandidate(selected.id, e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-sky-500"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key} className="bg-slate-900">
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact details */}
            <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="flex items-center gap-3 text-slate-300">
                <Mail size={16} className="text-slate-500" />
                {selected.email || "Not provided"}
              </p>
              <p className="flex items-center gap-3 text-slate-300">
                <Phone size={16} className="text-slate-500" />
                {selected.phone || "Not provided"}
              </p>
              <p className="flex items-center gap-3 text-slate-300">
                <MapPin size={16} className="text-slate-500" />
                {selected.location || "Not provided"}
              </p>
              <p className="flex items-center gap-3 text-slate-300">
                <Calendar size={16} className="text-slate-500" />
                Applied on {selected.appliedOn || "N/A"}
              </p>
            </div>

            {/* Profile details */}
            <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-500">Experience</p>
                <p className="mt-1 font-medium text-slate-100">
                  {selected.experience || "N/A"}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-500">Source</p>
                <p className="mt-1 font-medium text-slate-100">
                  {selected.source || "N/A"}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.skills.length > 0 ? (
                  selected.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-300"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">None listed</span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Notes
              </p>
              <p className="rounded-xl bg-white/5 p-4 text-sm text-slate-300">
                {selected.notes || "No notes yet."}
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}