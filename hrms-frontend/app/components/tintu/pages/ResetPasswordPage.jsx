"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "../layouts/AuthLayout.jsx";
import InputField from "../InputField.jsx";
import Alert from "../Alert.jsx";
import { resetPassword } from "../../../../services/tintu/authService.js";
import { callApi } from "../../../../services/tintu/utils/callApi.js";
import { getErrorMessage } from "../../../../services/tintu/utils/getErrorMessage.js";

// Opened from the email link:  /reset-password?token=<UUID>
// Calls POST /api/v1/auth/reset-password  { token, newPassword }
export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.newPassword.length < 8) e.newPassword = "Password must be at least 8 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    if (!token) return;
    if (!validate()) return;

    setLoading(true);
    const result = await callApi(() => resetPassword({ token, newPassword: form.newPassword }));
    setLoading(false);

    if (result.ok) {
      setDone(true);
      setAlert({
        type: "success",
        message: "Password has been reset successfully. Redirecting to login...",
      });
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setAlert({
        type: "error",
        message:
          getErrorMessage(result) ||
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your account">
      {!token ? (
        <>
          <Alert
            type="error"
            message="This reset link is missing its token. Please open the link from your email again."
          />
          <p className="mt-5 text-center text-sm text-slate-300">
            <Link href="/forgot-password" className="font-medium text-sky-400 hover:underline">
              Request a new reset link
            </Link>
          </p>
        </>
      ) : (
        <>
          <Alert type={alert.type} message={alert.message} />

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <InputField label="New Password" name="newPassword" type="password"
              placeholder="Min 8 characters"
              value={form.newPassword} onChange={handleChange} error={errors.newPassword}
              disabled={done} />

            <InputField label="Confirm Password" name="confirmPassword" type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
              disabled={done} />

            <button disabled={loading || done}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-300">
            <Link href="/forgot-password" className="font-medium text-sky-400 hover:underline">
              Link expired? Request a new one
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
