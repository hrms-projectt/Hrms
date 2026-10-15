"use client";

import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { uploadDocument } from "@/services/documentService";

const DOC_TYPES = [
  "Resume",
  "Aadhaar Card",
  "PAN Card",
  "Photo ID",
  "Address Proof",
  "Degree Certificate",
  "Experience Letter",
  "Other",
];

const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
const MAX_MB = 10;

export default function UploadDocumentModal({ onClose, onUploaded }) {
  const [form, setForm] = useState({
    ownerType: "CANDIDATE",
    ownerName: "",
    email: "",
    docType: DOC_TYPES[0],
  });
  const [file, setFile] = useState(null);
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

  const handleFile = (e) => {
    const picked = e.target.files?.[0];
    setError("");
    if (!picked) return setFile(null);

    if (!ALLOWED.includes(picked.type)) {
      setFile(null);
      return setError("Only PDF, PNG or JPG files are allowed.");
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      return setError(`File is too big. Maximum size is ${MAX_MB} MB.`);
    }
    setFile(picked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please choose a file.");

    setSaving(true);
    setError("");
    try {
      await uploadDocument({
        file,
        ownerType: form.ownerType,
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        docType: form.docType,
      });
      await onUploaded();
    } catch (err) {
      setError(err.message || "Upload failed");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500";

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
            <h3 className="text-lg font-semibold text-slate-100">
              Upload document
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Add a document for a candidate or an employee.
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Belongs to</label>
              <select
                name="ownerType"
                value={form.ownerType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="CANDIDATE" className="bg-slate-900">Candidate</option>
                <option value="EMPLOYEE" className="bg-slate-900">Employee</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Document type</label>
              <select
                name="docType"
                value={form.docType}
                onChange={handleChange}
                className={inputClass}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-slate-900">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Full name</label>
            <input
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              required
              placeholder="Praveen Veeranki"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-slate-400">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="praveen@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-slate-400">
              File (PDF, PNG or JPG, max {MAX_MB} MB)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              onChange={handleFile}
              className="w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-300 hover:file:bg-sky-500/25"
            />
            {file && (
              <p className="mt-1.5 text-xs text-slate-500">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
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
            className="flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
          >
            <Upload size={15} />
            {saving ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
