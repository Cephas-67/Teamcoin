import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      title={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      className="p-3 bg-black/30 dark:bg-white dark:text-black dark:hover:bg-white/30 dark:hover:text-white hover:bg-black/60 text-white transition-colors duration-500 text-lg rounded-full flex felx-row items-center gap-3"
    >
      {isDark ? <Sun className="w-7 h-7" /> : <Moon className="w-7 h-7" />}
    </button>
  );
}
