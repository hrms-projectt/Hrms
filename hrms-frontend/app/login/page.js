"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Building2, ArrowLeft, Check } from "lucide-react";

import { loginUser } from "@/services/authService";
import { poppins } from "../components/fonts";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errorCount, setErrorCount] = useState(0); // used to replay the shake

  // show an error and replay the shake animation
  const showError = (message) => {
    setError(message);
    setErrorCount((c) => c + 1);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Email validation
    if (!email.trim()) {
      showError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    // Password validation
    if (!password.trim()) {
      showError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser({
        email: email.trim(),
        password,
      });

      // save token and user
      localStorage.setItem("token", data.token);
      if (data.user) {
        // backend may send role as text OR as an object { id, name }
        const roleName =
          data.user.role && typeof data.user.role === "object"
            ? data.user.role.name
            : data.user.role;
        localStorage.setItem(
          "user",
          JSON.stringify({ ...data.user, role: roleName })
        );
      }

      // show the success message for a moment, then go to dashboard
      setSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      router.push("/dashboard");
    } catch (error) {
      showError(error.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || success;

  return (
    <div
            className={`${poppins.className} themed relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1020] px-4 py-8 text-slate-200`}
    >
      {/* animations used on this page */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .anim-fade-up { animation: fadeUp 0.6s ease-out both; }
        .anim-shake   { animation: shake 0.4s ease-in-out; }
        .anim-pop     { animation: popIn 0.35s ease-out both; }
        .anim-bar     { animation: fillBar 1.2s linear forwards; }
      `}</style>

      {/* background glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-sky-600/20 blur-3xl" />

      <div className="anim-fade-up relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        {/* Avatar with ring */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full border-4 border-[#2a8fd0] p-1 shadow-[0_0_40px_rgba(42,143,208,0.35)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-sky-300">
              <Building2 size={34} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
          <h1 className="text-center text-2xl font-medium text-slate-100">
            Welcome back
          </h1>
          <p className="mb-6 mt-1 text-center text-sm text-sky-400">
            Sign in to your HRMS account
          </p>

          {/* Error message (shakes each time) */}
          {error && (
            <div
              key={errorCount}
              className="anim-shake mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="anim-pop mb-5 overflow-hidden rounded-xl border border-green-500/30 bg-green-500/10 text-sm text-green-300">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <Check size={14} strokeWidth={3} />
                </span>
                <div>
                  <p className="font-medium">Login successful!</p>
                  <p className="text-xs text-green-400/80">
                    Redirecting to your dashboard...
                  </p>
                </div>
              </div>
              {/* progress bar */}
              <div className="h-1 bg-green-500/20">
                <div className="anim-bar h-full bg-green-400" />
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-11 pr-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={busy}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed
                ${success ? "bg-green-500" : "bg-sky-500 hover:bg-sky-400 disabled:opacity-70"}
              `}
            >
              {success ? (
                <>
                  <Check size={17} strokeWidth={3} />
                  Success
                </>
              ) : loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-sky-400 transition hover:text-sky-300">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-slate-400 transition hover:text-white">
              Create account
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © 2026 HRMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}