"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext =
  createContext<ThemeContextValue | undefined>(
    undefined
  );

const STORAGE_KEY = "gbyt-theme";

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<Theme>("light");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme =
      window.localStorage.getItem(STORAGE_KEY);

    const initialTheme: Theme =
      storedTheme === "dark"
        ? "dark"
        : "light";

    setThemeState(initialTheme);

    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );

    document.documentElement.dataset.theme =
      initialTheme;

    setMounted(true);
  }, []);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);

    window.localStorage.setItem(
      STORAGE_KEY,
      nextTheme
    );

    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );

    document.documentElement.dataset.theme =
      nextTheme;
  }

  function toggleTheme() {
    setTheme(
      theme === "dark"
        ? "light"
        : "dark"
    );
  }

  /*
   * Prevent hydration mismatch while the browser
   * determines the user's saved preference.
   */
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme,
          setTheme,
          toggleTheme,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}