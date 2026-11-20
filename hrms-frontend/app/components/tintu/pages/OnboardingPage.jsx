"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InputField from "../InputField.jsx";
import { useSession } from "../../../../services/tintu/utils/useSession.js";

export default function OnboardingPage() {
  const router = useRouter();
  const { employeeId } = useSession();
  const [id, setId] = useState("");

  // pre-fill with the logged-in employee's ID (read after first render)
  useEffect(() => {
    if (employeeId) setId((current) => current || employeeId);
  }, [employeeId]);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^\d+$/.test(id.trim())) {
      setError("Enter a valid numeric employee ID (for example 1)");
      return;
    }
    router.push(`/employees/${id.trim()}/documents`);
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-[#111833] p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-100">Onboarding</h1>
      <p className="mb-6 mt-1 text-sm text-slate-400">
        Enter an employee ID to view the onboarding documents and their verification status.
      </p>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField label="Employee ID" name="employeeId" placeholder="1"
          value={id} onChange={(e) => setId(e.target.value)} error={error} />
        <button className="w-full rounded-lg bg-sky-500 py-2.5 font-medium text-white hover:bg-sky-600">
          Open Checklist
        </button>
      </form>
    </div>
  );
}