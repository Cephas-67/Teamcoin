import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type Mode = "light" | "dark" | "system";

type Ctx = {
  theme: Theme;
  mode: Mode;
  setMode: (m: Mode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<Ctx>({
  theme: "dark",
  mode: "system",
  setMode: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "kando-theme-mode";

function getSystemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

function readInitialMode(): Mode {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") return saved;
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(readInitialMode);
  const [theme, setTheme] = useState<Theme>(() =>
    readInitialMode() === "system" ? getSystemTheme() : (readInitialMode() as Theme),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    setTheme(mode === "system" ? getSystemTheme() : mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const toggleTheme = () => setMode(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
