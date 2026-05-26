"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("wsp-theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <Button type="button" variant="outline" className="h-10 min-h-10 px-3" onClick={toggleTheme} title="Alternar tema">
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      <span className="hidden sm:inline">{isDark ? "Claro" : "Escuro"}</span>
    </Button>
  );
}
