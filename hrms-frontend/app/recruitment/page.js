"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import {
  Mail,
  Phone,
  Calendar,
  X,
  GripVertical,
  Check,
  AlertCircle,
  FileText,
  Briefcase,
  Search,
  Plus,
  UserPlus,
  UserCheck,
} from "lucide-react";
import {
  getCandidates,
  updateCandidateStatus,
  convertCandidate,
} from "@/services/recruitmentService";
import { AddJobModal, AddCandidateModal } from "../components/RecruitmentModals";
import { KanbanSkeleton } from "../components/Skeleton";

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
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "job" | "candidate" | null
  const [confirmId, setConfirmId] = useState(null); // candidate waiting for convert confirmation
  const [converting, setConverting] = useState(false);
  const [jobFilter, setJobFilter] = useState("ALL");

  // the open candidate is always read from the list, so it stays in sync
  const selected = candidates.find((c) => c.id === selectedId) || null;

  // filters: search by name/email and pick one job title
  const positions = [...new Set(candidates.map((c) => c.position).filter(Boolean))];
  const visible = candidates.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
    const matchJob = jobFilter === "ALL" || c.position === jobFilter;
    return matchSearch && matchJob;
  });
  const filtering = search.trim() !== "" || jobFilter !== "ALL";

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

  const reloadCandidates = () =>
    getCandidates()
      .then((data) => setCandidates(data))
      .catch((err) => setError(err.message || "Could not load candidates"));

  // Offer -> real employee record (Naresh's /convert endpoint)
  const handleConvert = async () => {
    if (!selected) return;
    setConverting(true);
    setError("");
    try {
      await convertCandidate(selected.id);
      setCandidates((list) =>
        list.map((c) => (c.id === selected.id ? { ...c, status: "CONVERTED" } : c))
      );
      showToast(`${selected.name} is now an employee`);
      setSelectedId(null);
    } catch (err) {
      setError(err.message || "Could not convert the candidate");
    } finally {
      setConverting(false);
      setConfirmId(null);
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
            Recruitment
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Drag candidates between columns to update their hiring stage.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setModal("job")}
            className="flex items-center gap-2 rounded-full bg-slate-700/40 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700/70"
          >
            <Plus size={16} />
            New Job Opening
          </button>
          <button
            onClick={() => setModal("candidate")}
            className="flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            <UserPlus size={16} />
            Add Candidate
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Search + job filter */}
      {!loading && candidates.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500"
            />
          </div>

          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-500"
          >
            <option value="ALL" className="bg-slate-900">
              All positions
            </option>
            {positions.map((p) => (
              <option key={p} value={p} className="bg-slate-900">
                {p}
              </option>
            ))}
          </select>

          {filtering && (
            <button
              onClick={() => {
                setSearch("");
                setJobFilter("ALL");
              }}
              className="rounded-full bg-slate-700/40 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700/70"
            >
              Clear filters
            </button>
          )}

          <span className="text-xs text-slate-500">
            Showing {visible.length} of {candidates.length} candidates
          </span>
        </div>
      )}

      {loading ? (
        <KanbanSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage) => {
            const items = visible.filter((c) => c.status === stage.key);
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
                            {c.position || "No job title"}
                          </p>
                        </div>
                        <GripVertical
                          size={16}
                          className="shrink-0 text-slate-600"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {c.phone || "No phone"}
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

      {/* Add job opening / add candidate */}
      {modal === "job" && (
        <AddJobModal
          onClose={() => setModal(null)}
          onCreated={() => {
            setModal(null);
            showToast("Job opening created");
          }}
        />
      )}
      {modal === "candidate" && (
        <AddCandidateModal
          onClose={() => setModal(null)}
          onCreated={() => {
            setModal(null);
            reloadCandidates();
            showToast("Candidate added to Applied");
          }}
        />
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
                  <p className="text-sm text-sky-400">
                    {selected.position || "No job title"}
                  </p>
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
                <Briefcase size={16} className="text-slate-500" />
                {selected.position || "No job title"}
              </p>
              <p className="flex items-center gap-3 text-slate-300">
                <Calendar size={16} className="text-slate-500" />
                Applied on {selected.appliedOn || "N/A"}
              </p>
            </div>

            {/* Resume */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Resume
              </p>
              {selected.resumeUrl ? (
                <a
                  href={selected.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/25"
                >
                  <FileText size={16} />
                  View resume
                </a>
              ) : (
                <span className="text-sm text-slate-500">
                  No resume uploaded
                </span>
              )}
            </div>

            {/* Convert to employee (only for candidates at the Offer stage) */}
            {selected.status === "OFFER" && (
              <div className="mt-6 border-t border-white/10 pt-6">
                {confirmId !== selected.id ? (
                  <button
                    onClick={() => setConfirmId(selected.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400"
                  >
                    <UserCheck size={17} />
                    Convert to Employee
                  </button>
                ) : (
                  <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                    <p className="text-sm text-orange-300">
                      This creates a real employee record for {selected.name}
                      and removes the card from the board. Continue?
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={handleConvert}
                        disabled={converting}
                        className="flex-1 rounded-full bg-green-500 py-2 text-sm font-semibold text-white transition hover:bg-green-400 disabled:opacity-50"
                      >
                        {converting ? "Converting..." : "Yes, convert"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        disabled={converting}
                        className="flex-1 rounded-full bg-slate-700/40 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}