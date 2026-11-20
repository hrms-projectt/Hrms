"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Alert from "../Alert.jsx";
import StatusBadge from "../StatusBadge.jsx";
import {
  convertCandidateToEmployee,
  getCandidateById,
} from "../../../../services/tintu/candidateService.js";
import { callApi } from "../../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../../services/tintu/utils/getErrorMessage.js";

// "OFFER_ACCEPTED", "Offer Accepted", "offer-accepted" all count
const isOfferAccepted = (stage) => {
  const s = String(stage || "").toUpperCase().replace(/[\s-]+/g, "_");
  return s === "OFFER" || s === "OFFER_ACCEPTED";
};

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-100">{children || "—"}</div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await callApi(() => getCandidateById(id));
      if (result.ok) setCandidate(result.data);
      else if (result.status === 404) setLoadError("Candidate not found.");
      else setLoadError(getErrorMessage(result));
      setLoading(false);
    })();
  }, [id]);

  const fullName = candidate
    ? candidate.fullName ||
      `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim()
    : "";
  const stage = candidate?.stage || candidate?.status;
  const canConvert = candidate && isOfferAccepted(stage);

  const openConfirm = () => {
    setConvertError("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (!converting) setConfirmOpen(false);
  };

  const handleConvert = async () => {
    if (converting) return;
    setConverting(true);
    setConvertError("");

    const result = await callApi(() => convertCandidateToEmployee(id));
    setConverting(false);

    if (result.ok) {
      const d = result.data || {};
      const employeeId = d.id ?? d.employeeId ?? d.employee?.id;
      setSuccess("Candidate converted to employee successfully! Redirecting...");
      setConfirmOpen(false);
      setTimeout(
        () => router.push(employeeId ? `/employees/${employeeId}` : "/employees"),
        1500
      );
    } else if (result.status === 409) {
      setConvertError("This candidate has already been converted to an employee.");
    } else if (result.status === 401 || result.status === 403) {
      setConvertError("You are not allowed to do this. Please login again.");
    } else if (result.status === 400) {
      setConvertError(
        getErrorMessage(result) ||
          "The candidate is not ready to be converted. Check the stage."
      );
    } else {
      setConvertError(getErrorMessage(result));
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-[#111833] p-6 shadow-sm sm:p-8">
      <Link href="/recruitment" className="text-sm text-sky-400 hover:underline">
        ← Back to Recruitment
      </Link>

      <h1 className="mb-6 mt-3 text-2xl font-bold text-slate-100">Candidate Profile</h1>

      <Alert type="error" message={loadError} />
      <Alert type="success" message={success} />
      {loading && <p className="text-slate-400">Loading candidate...</p>}

      {candidate && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Name">{fullName}</Field>
            <Field label="Stage">
              <StatusBadge status={stage} label={String(stage || "").replace(/_/g, " ")} />
            </Field>
            <Field label="Email">{candidate.email}</Field>
            <Field label="Phone">{candidate.phone}</Field>
            <Field label="Applied For">
              {candidate.jobTitle || candidate.position || candidate.job?.title}
            </Field>
            <Field label="Resume">
              {(candidate.resumeS3Url || candidate.resumeUrl) && (
                <a
                  href={candidate.resumeS3Url || candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  Open resume
                </a>
              )}
            </Field>
          </div>

          {canConvert && !success && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <button
                onClick={openConfirm}
                className="rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white hover:bg-green-700"
              >
                Convert to Employee
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation summary */}
      {confirmOpen && candidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeConfirm}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#111833] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-100">Convert to Employee?</h2>
            <p className="mt-1 text-sm text-slate-400">
              Please review the details before converting.
            </p>

            <div className="mt-4 space-y-2 rounded-lg bg-[#0f1a2e] p-4 text-sm">
              <p><span className="text-slate-400">Name:</span> <b>{fullName || "—"}</b></p>
              <p><span className="text-slate-400">Email:</span> <b>{candidate.email || "—"}</b></p>
              <p><span className="text-slate-400">Phone:</span> <b>{candidate.phone || "—"}</b></p>
              <p>
                <span className="text-slate-400">Stage:</span>{" "}
                <b>{String(stage || "").replace(/_/g, " ")}</b>
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              A new employee record will be created from this candidate.
            </p>

            {convertError && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {convertError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={closeConfirm}
                disabled={converting}
                className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={converting}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {converting ? "Converting..." : "Confirm & Convert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}