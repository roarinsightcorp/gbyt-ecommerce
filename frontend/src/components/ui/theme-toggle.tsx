"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "gbyt-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(
    STORAGE_KEY
  );

  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");

  root.style.colorScheme = theme;

  window.localStorage.setItem(
    STORAGE_KEY,
    theme
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] =
    useState<ThemeMode>("light");

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const initialTheme = getInitialTheme();

    applyTheme(initialTheme);

    setTheme(initialTheme);
    setMounted(true);
  }, []);

  function handleToggle() {
    const nextTheme: ThemeMode =
      theme === "dark" ? "light" : "dark";

    applyTheme(nextTheme);

    setTheme(nextTheme);

    window.dispatchEvent(
      new CustomEvent("gbyt-theme-change", {
        detail: nextTheme,
      })
    );
  }

  if (!mounted) {
    return (
      <div
        className="
          h-10
          w-10
          rounded-xl
          border
          border-slate-200
          bg-white/70
          dark:border-white/10
          dark:bg-white/[0.05]
        "
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="
        group
        inline-flex
        h-10
        w-10
        items-center
        justify-center
        rounded-xl
        border
        border-slate-200
        bg-white/75
        text-slate-600
        shadow-sm
        backdrop-blur-xl
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-[#0786AD]/30
        hover:text-[#0786AD]
        dark:border-white/10
        dark:bg-white/[0.06]
        dark:text-slate-300
        dark:hover:border-[#39D5F2]/30
        dark:hover:text-[#39D5F2]
      "
    >
      {isDark ? (
        <Sun
          size={18}
          strokeWidth={2}
          className="
            transition-transform
            duration-300
            group-hover:rotate-45
          "
        />
      ) : (
        <Moon
          size={18}
          strokeWidth={2}
          className="
            transition-transform
            duration-300
            group-hover:-rotate-12
          "
        />
      )}
    </button>
  );
}