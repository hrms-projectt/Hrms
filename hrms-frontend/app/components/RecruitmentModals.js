"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, UserPlus } from "lucide-react";
import {
  createJobOpening,
  createCandidate,
  getJobOpenings,
} from "@/services/recruitmentService";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500";

// shared frame: dark overlay + card + header with close button
function ModalFrame({ title, subtitle, icon: Icon, saving, onClose, onSubmit, children, error, submitText }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full border-2 border-[#2a8fd0] p-2">
              <Icon size={18} className="text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-400">{subtitle}</p>
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

        <div className="space-y-4">{children}</div>

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
            className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : submitText}
          </button>
        </div>
      </form>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-xs text-slate-400">{label}</label>
    {children}
  </div>
);

// ---------- 1. New job opening ----------
export function AddJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createJobOpening({
        title: form.title.trim(),
        department: form.department.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        status: "OPEN",
      });
      onCreated();
    } catch (err) {
      setError(err.message || "Could not create the job opening");
      setSaving(false);
    }
  };

  return (
    <ModalFrame
      title="New job opening"
      subtitle="Candidates can then be added to this job."
      icon={Briefcase}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      submitText="Create job"
    >
      <Field label="Job title">
        <input name="title" value={form.title} onChange={handleChange} required placeholder="Frontend Developer" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Department">
          <input name="department" value={form.department} onChange={handleChange} placeholder="Engineering" className={inputClass} />
        </Field>
        <Field label="Location">
          <input name="location" value={form.location} onChange={handleChange} placeholder="Bengaluru" className={inputClass} />
        </Field>
      </div>
      <Field label="Description (optional)">
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Short summary of the role" className={`${inputClass} resize-none`} />
      </Field>
    </ModalFrame>
  );
}

// ---------- 3. Add candidate (with resume) ----------
const RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function AddCandidateModal({ onClose, onCreated }) {
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", jobOpeningId: "" });
  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load job openings for the dropdown
  useEffect(() => {
    getJobOpenings()
      .then((list) => setJobs(list.filter((j) => j.status === "OPEN")))
      .catch((err) => setError(err.message || "Could not load job openings"))
      .finally(() => setJobsLoading(false));
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    setError("");
    if (!picked) return setResume(null);
    if (!RESUME_TYPES.includes(picked.type)) {
      setResume(null);
      return setError("Resume must be a PDF, DOC or DOCX file.");
    }
    if (picked.size > 10 * 1024 * 1024) {
      setResume(null);
      return setError("Resume is too big. Maximum size is 10 MB.");
    }
    setResume(picked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) return setError("Please choose a resume file.");
    setSaving(true);
    setError("");
    try {
      await createCandidate({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        jobOpeningId: Number(form.jobOpeningId),
        resume,
      });
      onCreated();
    } catch (err) {
      setError(err.message || "Could not add the candidate");
      setSaving(false);
    }
  };

  return (
    <ModalFrame
      title="Add candidate"
      subtitle="The candidate starts in the Applied column."
      icon={UserPlus}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
      error={error}
      submitText="Add candidate"
    >
      <Field label="Full name">
        <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Anjali Sharma" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="anjali@example.com" className={inputClass} />
        </Field>
        <Field label="Phone">
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="9876543210" className={inputClass} />
        </Field>
      </div>
      <Field label="Applying for">
        <select name="jobOpeningId" value={form.jobOpeningId} onChange={handleChange} required disabled={jobsLoading} className={inputClass}>
          <option value="">{jobsLoading ? "Loading jobs..." : "Select a job opening"}</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id} className="bg-slate-900">
              {j.title}
            </option>
          ))}
        </select>
        {!jobsLoading && jobs.length === 0 && (
          <p className="mt-1.5 text-xs text-orange-400">
            No open job openings yet. Create one first with &quot;New Job Opening&quot;.
          </p>
        )}
      </Field>
      <Field label="Resume (PDF, DOC or DOCX, max 10 MB)">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFile}
          className="w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-300 hover:file:bg-sky-500/25"
        />
        {resume && (
          <p className="mt-1.5 text-xs text-slate-500">
            {resume.name} ({(resume.size / 1024).toFixed(0)} KB)
          </p>
        )}
      </Field>
    </ModalFrame>
  );
}
