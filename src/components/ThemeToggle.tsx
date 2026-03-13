import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vanta-theme");
      if (stored) return stored === "light";
      return true; // default to light
    }
    return true;
  });

  useEffect(() => {
    if (light) {
      document.documentElement.classList.add("light");
      localStorage.setItem("vanta-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("vanta-theme", "dark");
    }
  }, [light]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("vanta-theme");
    if (stored === "light") {
      setLight(true);
    }
  }, []);

  return (
    <button
      onClick={() => setLight((prev) => !prev)}
      className="flex items-center gap-2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-vanta-text-low hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {light ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      <span>{light ? "Dark" : "Light"}</span>
    </button>
  );
}
