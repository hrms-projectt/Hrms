"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "../Alert.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { DOCUMENT_TYPES, HR_ROLES } from "../../../../services/tintu/config/documentTypes.js";
import { useSession } from "../../../../services/tintu/utils/useSession.js";
import {
  getEmployeeDocuments,
  uploadEmployeeDocument,
  verifyDocument,
} from "../../../../services/tintu/onboardingService.js";
import { callApi } from "../../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../../services/tintu/utils/getErrorMessage.js";

const POLL_MS = 30000;
const MAX_MB = 5;
const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
const CAN_UPLOAD = ["NOT_UPLOADED", "REJECTED", "REQUEST_REUPLOAD"];

export default function OnboardingDocumentsPage() {
  const { id } = useParams();
  const { role } = useSession();
  const isHR = HR_ROLES.includes(role);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [updatedAt, setUpdatedAt] = useState(null);
  const [uploadingType, setUploadingType] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");

  const loadDocs = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const result = await callApi(() => getEmployeeDocuments(id));
      if (result.ok) {
        const d = result.data;
        setDocs(Array.isArray(d) ? d : d?.documents ?? []);
        setError("");
        setUpdatedAt(new Date());
      } else if (!silent) {
        setError(getErrorMessage(result));
      }
      if (!silent) setLoading(false);
    },
    [id]
  );

  useEffect(() => {
    loadDocs();
    const timer = setInterval(() => loadDocs(true), POLL_MS);
    return () => clearInterval(timer);
  }, [loadDocs]);

  // One checklist item per expected document type, plus any extra type the API returns
  const items = useMemo(() => {
    const byType = {};
    docs.forEach((d) => (byType[d.documentType] = d));
    const list = DOCUMENT_TYPES.map((t) => ({
      type: t.value,
      label: t.label,
      doc: byType[t.value] || null,
    }));
    docs
      .filter((d) => !DOCUMENT_TYPES.some((t) => t.value === d.documentType))
      .forEach((d) => list.push({ type: d.documentType, label: d.documentType, doc: d }));
    return list.map((i) => ({
      ...i,
      status: i.doc ? String(i.doc.verificationStatus).toUpperCase() : "NOT_UPLOADED",
    }));
  }, [docs]);

  const completed = items.filter((i) => i.status === "VERIFIED");
  const pending = items.filter((i) => i.status !== "VERIFIED");
  const percent = items.length ? Math.round((completed.length / items.length) * 100) : 0;

  const handleFile = async (item, e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setAlert({ type: "", message: "" });

    if (!ALLOWED.includes(file.type)) {
      setAlert({ type: "error", message: "Only PDF, PNG or JPG files are allowed." });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setAlert({ type: "error", message: `File must be smaller than ${MAX_MB} MB.` });
      return;
    }

    setUploadingType(item.type);
    const result = await callApi(() => uploadEmployeeDocument(id, file, item.type));
    setUploadingType(null);

    if (result.ok) {
      setAlert({ type: "success", message: `${item.label} uploaded successfully.` });
      loadDocs(true);
    } else {
      setAlert({ type: "error", message: getErrorMessage(result) });
    }
  };

  const sendVerification = async (item, status, rejectionReason = "") => {
    setAlert({ type: "", message: "" });
    setBusyId(item.doc.documentId);
    const result = await callApi(() =>
      verifyDocument(item.doc.documentId, { status, rejectionReason })
    );
    setBusyId(null);

    if (result.ok) {
      setAlert({ type: "success", message: `${item.label}: status updated.` });
      setRejectingId(null);
      setReason("");
      loadDocs(true);
    } else {
      setAlert({ type: "error", message: getErrorMessage(result) });
    }
  };

  const confirmReject = (item) => {
    if (!reason.trim()) {
      setAlert({ type: "error", message: "Rejection reason is required." });
      return;
    }
    sendVerification(item, "REJECTED", reason.trim());
  };

  const renderCard = (item) => {
    const docId = item.doc?.documentId;
    const showHrActions = isHR && item.status === "PENDING";

    return (
      <div key={item.type} className="rounded-xl border border-white/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-100">{item.label}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusBadge status={item.status} />
              {item.doc?.fileUrl && (
                <a href={item.doc.fileUrl} target="_blank" rel="noreferrer"
                  className="text-sm text-sky-400 hover:underline">
                  View file
                </a>
              )}
            </div>
            {item.doc?.rejectionReason && (
              <p className="mt-2 text-sm text-red-400">
                Reason: {item.doc.rejectionReason}
              </p>
            )}
          </div>

          {CAN_UPLOAD.includes(item.status) && (
            <label
              className={`cursor-pointer whitespace-nowrap rounded-lg bg-sky-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-sky-600 ${
                uploadingType === item.type ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {uploadingType === item.type
                ? "Uploading..."
                : item.status === "NOT_UPLOADED"
                ? "Upload Document"
                : "Upload Again"}
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
                onChange={(e) => handleFile(item, e)} />
            </label>
          )}
        </div>

        {showHrActions && (
          <div className="mt-4 border-t border-white/10 pt-4">
            {rejectingId === docId ? (
              <div>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for rejection (required)"
                  className="w-full rounded-lg border border-white/15 p-2 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
                <div className="mt-2 flex gap-2">
                  <button disabled={busyId === docId} onClick={() => confirmReject(item)}
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60">
                    Confirm Reject
                  </button>
                  <button onClick={() => { setRejectingId(null); setReason(""); }}
                    className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm hover:bg-white/10">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button disabled={busyId === docId}
                  onClick={() => sendVerification(item, "VERIFIED")}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60">
                  Verify
                </button>
                <button disabled={busyId === docId}
                  onClick={() => { setRejectingId(docId); setReason(""); }}
                  className="rounded-lg bg-red-500/10 px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/20">
                  Reject
                </button>
                <button disabled={busyId === docId}
                  onClick={() => sendVerification(item, "REQUEST_REUPLOAD")}
                  className="rounded-lg bg-orange-500/10 px-4 py-1.5 text-sm text-orange-300 hover:bg-orange-500/20">
                  Request Re-upload
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/employees" className="text-sm text-sky-400 hover:underline">
        ← Back to Employees
      </Link>

      <div className="mb-5 mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Onboarding Documents</h1>
          <p className="text-sm text-slate-400">Employee ID: {id}</p>
        </div>
        <button onClick={() => loadDocs()}
          className="rounded-lg bg-[#111833] px-4 py-2 text-sm shadow-sm hover:bg-white/5">
          Refresh
        </button>
      </div>

      <Alert type="error" message={error} />
      <Alert type={alert.type} message={alert.message} />

      <div className="mb-6 rounded-2xl bg-[#111833] p-5 shadow-sm">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-slate-300">
            {completed.length} of {items.length} documents verified
          </span>
          <span className="font-semibold text-sky-400">{percent}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
          <div className="h-full rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${percent}%` }} />
        </div>
        {updatedAt && (
          <p className="mt-2 text-xs text-slate-400">
            Last updated {updatedAt.toLocaleTimeString()} (auto-refreshes every 30 seconds)
          </p>
        )}
      </div>

      {loading && <p className="text-slate-400">Loading documents...</p>}

      {!loading && pending.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-400">
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">{pending.map(renderCard)}</div>
        </section>
      )}

      {!loading && completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-400">
            Completed ({completed.length})
          </h2>
          <div className="space-y-3">{completed.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}