"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
const [mounted, setMounted] = useState(false);
const [isDark, setIsDark] = useState(false);

useEffect(() => {
setMounted(true);


const dark =
  document.documentElement.classList.contains("dark");

setIsDark(dark);


}, []);

const toggleTheme = () => {
const nextIsDark = !isDark;


document.documentElement.classList.toggle(
  "dark",
  nextIsDark
);

localStorage.setItem(
  "theme",
  nextIsDark ? "dark" : "light"
);

setIsDark(nextIsDark);


};

if (!mounted) {
return ( <button
     type="button"
     aria-label="Toggle theme"
     disabled
     className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] opacity-70"
   > <span className="h-4 w-4 rounded-full border-2 border-[var(--muted)] border-t-transparent" /> </button>
);
}

return (
<button
type="button"
onClick={toggleTheme}
aria-label={
isDark
? "Switch to light mode"
: "Switch to dark mode"
}
className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-[0_8px_24px_rgba(8,126,164,0.12)]"
> <span
     className="text-lg leading-none transition-transform duration-300"
     aria-hidden="true"
   >
{isDark ? "☀" : "☾"} </span> </button>
);
}
