"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import {
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  Search,
  AlertCircle,
  Check,
  X,
  User,
} from "lucide-react";
import {
  getDocuments,
  verifyDocument,
  rejectDocument,
  requestReupload,
} from "@/services/documentService";
import ImageViewer, { downloadFile } from "../components/ImageViewer";
import UploadDocumentModal from "../components/UploadDocumentModal";
import { DocumentsSkeleton } from "../components/Skeleton";

// tells the sidebar to refresh its red "pending" number
const notifyChange = () => window.dispatchEvent(new Event("documents-changed"));

const ALLOWED_ROLES = ["SUPER_ADMIN", "HR_ADMIN"];

const STATUS = {
  PENDING: {
    label: "Pending",
    badge: "bg-yellow-500/15 text-yellow-400",
    icon: Clock,
  },
  VERIFIED: {
    label: "Verified",
    badge: "bg-green-500/15 text-green-400",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-red-500/15 text-red-400",
    icon: XCircle,
  },
  REUPLOAD_REQUESTED: {
    label: "Re-upload requested",
    badge: "bg-orange-500/15 text-orange-400",
    icon: RefreshCw,
  },
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
  { key: "REUPLOAD_REQUESTED", label: "Re-upload" },
];

// decide if the file is a pdf or an image
const getFileKind = (doc) => {
  const type = (doc.fileType || "").toLowerCase();
  const path = (doc.fileUrl || doc.fileName || "").split("?")[0].toLowerCase();

  if (type.includes("pdf") || path.endsWith(".pdf")) return "pdf";
  if (
    type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(path)
  )
    return "image";
  return "other";
};

function StatusBadge({ status, small = false }) {
  const s = STATUS[status] || STATUS.PENDING;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${s.badge} ${
        small ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      <Icon size={small ? 12 : 14} />
      {s.label}
    </span>
  );
}

// ---------- Preview (PDF / image) ----------
function DocumentPreview({ doc }) {
  const kind = getFileKind(doc);

  if (!doc.fileUrl) {
    return (
      <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-slate-500">
        No file available
      </div>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        key={doc.id}
        src={doc.fileUrl}
        title={doc.fileName || doc.docType}
        className="h-[520px] w-full rounded-xl bg-white"
      />
    );
  }

  if (kind === "image") {
    return (
      <ImageViewer
        key={doc.id}
        src={doc.fileUrl}
        alt={doc.fileName || doc.docType}
      />
    );
  }

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
      <FileText size={40} className="text-slate-600" />
      <p className="text-sm text-slate-400">
        This file type cannot be previewed in the browser.
      </p>
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/25"
      >
        Open file
      </a>
    </div>
  );
}

// ---------- Modal used for Reject and Request Re-upload ----------
function ReasonModal({
  title,
  description,
  label,
  placeholder,
  required,
  confirmText,
  confirmClass,
  onClose,
  onConfirm,
}) {
  const [text, setText] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();

    if (required && !value) {
      setError("Please enter a reason.");
      return;
    }
    if (required && value.length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onConfirm(value);
    } catch (err) {
      setError(err.message || "Something went wrong");
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
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
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

        <label className="mb-2 block text-sm text-slate-300">
          {label}
          {required && <span className="text-red-400"> *</span>}
        </label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={saving}
          autoFocus
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
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${confirmClass}`}
          >
            {saving ? "Saving..." : confirmText}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Page ----------
export default function DocumentVerificationPage() {
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null); // "reject" | "reupload" | null
  const [verifying, setVerifying] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

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

  // Load documents
  useEffect(() => {
    if (!allowed) return;
    getDocuments()
      .then((data) => {
        setDocuments(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((err) => setError(err.message || "Could not load documents"))
      .finally(() => setLoading(false));
  }, [allowed]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  // counts shown on the filter tabs
  const counts = useMemo(() => {
    const result = { ALL: documents.length };
    documents.forEach((d) => {
      result[d.status] = (result[d.status] || 0) + 1;
    });
    return result;
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      const matchStatus = filter === "ALL" || d.status === filter;
      const matchSearch =
        !q ||
        d.ownerName.toLowerCase().includes(q) ||
        d.docType.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [documents, filter, search]);

  // the open document is always read from the list, so it stays in sync
  const selected = documents.find((d) => d.id === selectedId) || null;

  // update one document in the list
  const patchDocument = (id, patch) => {
    setDocuments((list) =>
      list.map((d) => (d.id === id ? { ...d, ...patch } : d))
    );
  };

  // ----- actions -----
  const handleVerify = async () => {
    if (!selected) return;
    setError("");
    setVerifying(true);
    try {
      await verifyDocument(selected.id);
      patchDocument(selected.id, { status: "VERIFIED", remarks: "" });
      showToast(`${selected.docType} verified`);
      notifyChange();
    } catch (err) {
      setError(err.message || "Could not verify the document");
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async (reason) => {
    await rejectDocument(selected.id, reason);
    patchDocument(selected.id, { status: "REJECTED", remarks: reason });
    setModal(null);
    showToast(`${selected.docType} rejected`);
    notifyChange();
  };

  const handleReupload = async (note) => {
    await requestReupload(selected.id, note);
    patchDocument(selected.id, { status: "REUPLOAD_REQUESTED", remarks: note });
    setModal(null);
    showToast(`Re-upload requested for ${selected.docType}`);
    notifyChange();
  };

  if (!allowed) return null;

  return (
    <MainLayout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
            Document Verification
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Review uploaded documents next to the person&apos;s details, then
            verify, reject or request a re-upload.
          </p>
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards (click one to filter the list) */}
      {!loading && documents.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {["PENDING", "VERIFIED", "REJECTED", "REUPLOAD_REQUESTED"].map(
            (key) => {
              const info = STATUS[key];
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(filter === key ? "ALL" : key)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition hover:border-sky-500/40 ${
                    filter === key
                      ? "border-sky-500/50 bg-sky-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div>
                    <p className="text-sm text-slate-400">{info.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-100">
                      {counts[key] || 0}
                    </p>
                  </div>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${info.badge}`}
                  >
                    <Icon size={20} />
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}

      {loading ? (
        <DocumentsSkeleton />
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-slate-500">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          {/* ================= LEFT: document list ================= */}
          <div className="rounded-2xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 p-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or document"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      filter === f.key
                        ? "bg-sky-500/20 text-sky-300"
                        : "bg-slate-700/40 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f.label} ({counts[f.key] || 0})
                  </button>
                ))}
              </div>
            </div>

            <ul className="max-h-[560px] overflow-y-auto">
              {filtered.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full border-t border-white/10 px-4 py-3 text-left transition first:border-t-0 ${
                      selectedId === d.id
                        ? "bg-sky-500/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {d.docType}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {d.ownerName}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        {d.ownerType}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={d.status} small />
                      <span className="text-[11px] text-slate-500">
                        {d.uploadedOn}
                      </span>
                    </div>
                  </button>
                </li>
              ))}

              {filtered.length === 0 && (
                <li className="px-4 py-10 text-center text-xs text-slate-600">
                  No documents match your filter.
                </li>
              )}
            </ul>
          </div>

          {/* ================= RIGHT: preview + details ================= */}
          {selected ? (
            <div className="grid gap-6 2xl:grid-cols-[1fr_340px]">
              {/* Preview */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-100">
                      {selected.docType}
                    </h2>
                    <p className="truncate text-xs text-slate-500">
                      {selected.fileName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={selected.status} />
                    {selected.fileUrl && (
                      <>
                        <a
                          href={selected.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-slate-700/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/70"
                        >
                          <ExternalLink size={13} />
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadFile(selected.fileUrl, selected.fileName)}
                          className="flex items-center gap-1.5 rounded-full bg-slate-700/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/70"
                        >
                          <Download size={13} />
                          Download
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <DocumentPreview doc={selected} />
              </div>

              {/* Details + actions */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full border-2 border-[#2a8fd0] p-0.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-sky-300">
                        {selected.ownerName.charAt(0)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-100">
                        {selected.ownerName}
                      </p>
                      <p className="text-xs text-sky-400">
                        {selected.ownerType === "CANDIDATE"
                          ? "Candidate"
                          : "Employee"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <p className="flex items-center gap-3 text-slate-300">
                      <Mail size={16} className="shrink-0 text-slate-500" />
                      <span className="truncate">
                        {selected.email || "Not provided"}
                      </span>
                    </p>
                    <p className="flex items-center gap-3 text-slate-300">
                      <Phone size={16} className="shrink-0 text-slate-500" />
                      {selected.phone || "Not provided"}
                    </p>
                    <p className="flex items-center gap-3 text-slate-300">
                      <Briefcase size={16} className="shrink-0 text-slate-500" />
                      {selected.position || "No job title"}
                    </p>
                    <p className="flex items-center gap-3 text-slate-300">
                      <Building2 size={16} className="shrink-0 text-slate-500" />
                      {selected.department || "No department"}
                    </p>
                    <p className="flex items-center gap-3 text-slate-300">
                      <Calendar size={16} className="shrink-0 text-slate-500" />
                      Uploaded on {selected.uploadedOn || "N/A"}
                    </p>
                    {selected.reviewedBy && (
                      <p className="flex items-center gap-3 text-slate-300">
                        <User size={16} className="shrink-0 text-slate-500" />
                        Reviewed by {selected.reviewedBy}
                        {selected.reviewedOn && ` on ${selected.reviewedOn}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Remarks (rejection reason / re-upload note) */}
                {selected.remarks &&
                  (selected.status === "REJECTED" ||
                    selected.status === "REUPLOAD_REQUESTED") && (
                    <div
                      className={`rounded-2xl border p-4 text-sm ${
                        selected.status === "REJECTED"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : "border-orange-500/30 bg-orange-500/10 text-orange-300"
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
                        {selected.status === "REJECTED"
                          ? "Rejection reason"
                          : "Re-upload note"}
                      </p>
                      {selected.remarks}
                    </div>
                  )}

                {/* Verified message */}
                {selected.status === "VERIFIED" && (
                  <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    This document has been verified.
                  </div>
                )}

                {/* Action buttons */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actions
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleVerify}
                      disabled={verifying || selected.status === "VERIFIED"}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={17} />
                      {verifying ? "Verifying..." : "Verify"}
                    </button>

                    <button
                      onClick={() => setModal("reject")}
                      disabled={verifying}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-red-500/15 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>

                    <button
                      onClick={() => setModal("reupload")}
                      disabled={verifying}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500/15 py-2.5 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/25 disabled:opacity-50"
                    >
                      <RefreshCw size={17} />
                      Request Re-upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
              Select a document to review it.
            </div>
          )}
        </div>
      )}

      {/* Reject modal */}
      {modal === "reject" && selected && (
        <ReasonModal
          title="Reject document"
          description={`${selected.docType} of ${selected.ownerName}`}
          label="Reason for rejection"
          placeholder="e.g. The scan is blurry and the name is not readable."
          required
          confirmText="Reject document"
          confirmClass="bg-red-500 hover:bg-red-400"
          onClose={() => setModal(null)}
          onConfirm={handleReject}
        />
      )}

      {/* Request re-upload modal */}
      {modal === "reupload" && selected && (
        <ReasonModal
          title="Request re-upload"
          description={`${selected.docType} of ${selected.ownerName}`}
          label="Note for the uploader (optional)"
          placeholder="e.g. Please upload a clearer copy of the front side."
          required={false}
          confirmText="Send request"
          confirmClass="bg-orange-500 hover:bg-orange-400"
          onClose={() => setModal(null)}
          onConfirm={handleReupload}
        />
      )}

      {/* Upload document */}
      {uploadOpen && (
        <UploadDocumentModal
          onClose={() => setUploadOpen(false)}
          onUploaded={async () => {
            setUploadOpen(false);
            showToast("Document uploaded");
            notifyChange();
            try {
              const fresh = await getDocuments();
              setDocuments(fresh);
              if (fresh.length > 0) setSelectedId(fresh[0].id);
            } catch (err) {
              setError(err.message || "Could not reload documents");
            }
          }}
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