"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import InputField from "../InputField.jsx";
import Alert from "../Alert.jsx";
import { getEmployeeById, updateEmployee } from "../../../../services/tintu/employeeService.js";
import { callApi } from "../../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../../services/tintu/utils/getErrorMessage.js";

// Confirm the allowed status values with Naresh
const STATUSES = ["ACTIVE", "INACTIVE"];

export default function EmployeeEditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "ACTIVE",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await callApi(() => getEmployeeById(id));
      if (result.ok) {
        const d = result.data;
        setForm({
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          email: d.email || "",
          phone: d.phone || "",
          status: d.status || "ACTIVE",
        });
        setLoaded(true);
      } else if (result.status === 404) {
        setAlert({ type: "error", message: "Employee not found." });
      } else {
        setAlert({ type: "error", message: getErrorMessage(result) });
      }
      setLoading(false);
    })();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Phone must be 10 digits";
    if (!form.status) e.status = "Select a status";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    if (!validate()) return;

    setSaving(true);
    const result = await callApi(() =>
      updateEmployee(id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
      })
    );
    setSaving(false);

    if (result.ok) {
      setAlert({ type: "success", message: "Employee updated successfully! Redirecting..." });
      setTimeout(() => router.push(`/employees/${id}`), 1500);
    } else if (result.status === 401 || result.status === 403) {
      setAlert({ type: "error", message: "Access denied. Please login again." });
    } else {
      setAlert({ type: "error", message: getErrorMessage(result) });
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-[#111833] p-8 shadow-sm">
      <Link href="/employees" className="text-sm text-sky-400 hover:underline">
        ← Back to Employees
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold text-slate-100">Edit Employee</h1>

      <Alert type={alert.type} message={alert.message} />
      {loading && <p className="text-slate-400">Loading employee...</p>}

      {loaded && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <InputField label="First Name" name="firstName" value={form.firstName}
              onChange={handleChange} error={errors.firstName} />
            <InputField label="Last Name" name="lastName" value={form.lastName}
              onChange={handleChange} error={errors.lastName} />
          </div>
          <InputField label="Email" name="email" type="email" value={form.email}
            onChange={handleChange} error={errors.email} />
          <InputField label="Phone" name="phone" value={form.phone}
            onChange={handleChange} error={errors.phone} />
          <InputField label="Status" name="status" value={form.status}
            onChange={handleChange} error={errors.status}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </InputField>

          <div className="mt-2 flex gap-3">
            <button disabled={saving}
              className="rounded-lg bg-sky-500 px-6 py-2.5 font-medium text-white hover:bg-sky-600 disabled:opacity-60">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href={`/employees/${id}`}
              className="rounded-lg bg-slate-800 px-6 py-2.5 font-medium text-slate-300 hover:bg-white/10">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}