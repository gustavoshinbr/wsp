"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  showLabelOnMobile = false,
}: {
  className?: string;
  showLabelOnMobile?: boolean;
}) {
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
    <Button
      type="button"
      variant="outline"
      className={cn("h-10 min-h-10 px-3", className)}
      onClick={toggleTheme}
      title="Alternar tema"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      <span className={showLabelOnMobile ? "inline" : "hidden sm:inline"}>
        {isDark ? "Claro" : "Escuro"}
      </span>
    </Button>
  );
}
