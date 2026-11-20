"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "../layouts/AuthLayout.jsx";
import InputField from "../InputField.jsx";
import Alert from "../Alert.jsx";
import { forgotPassword } from "../../../../services/tintu/authService.js";
import { callApi } from "../../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../../services/tintu/utils/getErrorMessage.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");

    setLoading(true);
    const result = await callApi(() => forgotPassword({ email: email.trim() }));
    setLoading(false);

    if (result.ok) {
      setAlert({
        type: "success",
        message: "Password reset link has been sent. Please check your email.",
      });
      setEmail("");
    } else {
      setAlert({ type: "error", message: getErrorMessage(result) });
    }
  };

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
      <Alert type={alert.type} message={alert.message} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField label="Email" name="email" type="email" placeholder="you@company.com"
          value={email} onChange={(e) => setEmail(e.target.value)} error={error} />

        <button disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-300">
        <Link href="/login" className="font-medium text-sky-400 hover:underline">
          ← Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
}