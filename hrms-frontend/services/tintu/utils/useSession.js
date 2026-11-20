"use client";

import { useEffect, useState } from "react";

// HRMS login (Srilekha's login page) saves the user as ONE json object:
//   localStorage.user = {"fullName": "...", "email": "...", "role": "SUPER_ADMIN", ...}
// Tintu's original code read separate keys ("role", "employeeId") that this login
// never writes, so every role check returned "" and HR-only buttons stayed hidden.
// This file is the ONE place that knows how to read the logged-in user.

export function readSession() {
  if (typeof window === "undefined") return { role: "", employeeId: "", fullName: "" };

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  // backend may send role as text OR as an object { id, name }
  const rawRole = user.role && typeof user.role === "object" ? user.role.name : user.role;

  return {
    role: String(rawRole || localStorage.getItem("role") || ""),
    employeeId: String(
      user.employeeId ?? user.employee?.id ?? localStorage.getItem("employeeId") ?? ""
    ),
    fullName: String(user.fullName || localStorage.getItem("fullName") || ""),
  };
}

// Use inside components. localStorage does not exist while Next.js renders on the
// server, so the values are read AFTER the first render. Wait for `ready` before
// showing "no access" messages, otherwise they flash for a split second.
export function useSession() {
  const [session, setSession] = useState({ role: "", employeeId: "", fullName: "", ready: false });

  useEffect(() => {
    setSession({ ...readSession(), ready: true });
  }, []);

  return session;
}
