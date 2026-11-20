"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// The theme is saved per logged-in user (theme:<email>), so each person who
// logs in on the same computer gets the mode they chose. Default is dark.
const getKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.email ? `theme:${user.email}` : "theme";
  } catch {
    return "theme";
  }
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  // on load: apply this user's saved choice
  useEffect(() => {
    const saved = localStorage.getItem(getKey()) || "dark";
    applyTheme(saved);
    setTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(getKey(), next);
      localStorage.setItem("theme", next); // also used by the login page
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark and light mode"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/40 text-slate-300 transition hover:bg-slate-700/70"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}