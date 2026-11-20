"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Alert from "../Alert.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { getEmployeeById } from "../../../../services/tintu/employeeService.js";
import { callApi } from "../../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../../services/tintu/utils/getErrorMessage.js";

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-100">{children || "—"}</div>
    </div>
  );
}

export default function EmployeeViewPage() {
  const { id } = useParams();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await callApi(() => getEmployeeById(id));
      if (result.ok) setEmp(result.data);
      else if (result.status === 404) setError("Employee not found.");
      else setError(getErrorMessage(result));
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-[#111833] p-6 shadow-sm">
      <Link href="/employees" className="text-sm text-sky-400 hover:underline">
        ← Back to Employees
      </Link>

      <h1 className="mb-6 mt-3 text-2xl font-bold text-slate-100">Employee Profile</h1>

      <Alert type="error" message={error} />
      {loading && <p className="text-slate-400">Loading...</p>}

      {emp && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Employee ID">{emp.employeeCode}</Field>
            <Field label="Status">
              <StatusBadge status={emp.status} />
            </Field>
            <Field label="Name">{`${emp.firstName || ""} ${emp.lastName || ""}`.trim()}</Field>
            <Field label="Email">{emp.email}</Field>
            <Field label="Phone">{emp.phone}</Field>
            <Field label="Organization">{emp.organization?.name}</Field>
            <Field label="Resume">
              {emp.resumeS3Url && (
                <a
                  href={emp.resumeS3Url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  Open resume
                </a>
              )}
            </Field>
          </div>

          <div className="mt-8 flex gap-3">
  <Link href={`/employees/${emp.id}/edit`}
    className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600"
  >
    Edit
  </Link>
  <Link href={`/employees/${emp.id}/documents`}
    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
  >
    Onboarding Documents
  </Link>

  <Link href={`/employees/${emp.id}/salary`}
  className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
>
  Salary
</Link>
</div>
        </>
      )}
    </div>
  );
}