"use client";

import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { poppins } from "../../fonts.js";

// Same look as Srilekha's /login page (dark background, blue glow, ringed logo,
// glass card) so Login, Signup and Forgot Password feel like one product.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className={`${poppins.className} themed relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1020] px-4 py-8 text-slate-200`}
    >
      {/* background glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-sky-600/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        {/* Logo with ring */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full border-4 border-[#2a8fd0] p-1 shadow-[0_0_40px_rgba(42,143,208,0.35)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-sky-300">
              <Building2 size={34} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl sm:p-8">
          <h1 className="text-center text-2xl font-medium text-slate-100">{title}</h1>
          <p className="mb-6 mt-1 text-center text-sm text-sky-400">{subtitle}</p>
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} HRMS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
