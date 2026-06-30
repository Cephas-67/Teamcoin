import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";


const rgbVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        bg: rgbVar("k-bg"),
        surface: rgbVar("k-surface"),
        "surface-2": rgbVar("k-surface-2"),
        border: rgbVar("k-border"),
        "border-strong": rgbVar("k-border-strong"),
        text: rgbVar("k-text"),
        muted: rgbVar("k-muted"),
        accent: rgbVar("k-accent"),
        "accent-hover": rgbVar("k-accent-hover"),
        "accent-contrast": rgbVar("k-accent-contrast"),
        warn: rgbVar("k-warn"),
        danger: rgbVar("k-danger"),
        info: rgbVar("k-info"),
        gandehou: {
          green: "#008850",
          yellow: "#FCD20F",
          red: "#E90929",
          paper: "#F8F7E7",
        },
      },
      fontFamily: {
        sans: ['"Work Sans"', "system-ui", "sans-serif"],
        display: ['"Work Sans"', "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      // ── MOVED INTO EXTEND ──────────────────────────────────────
      // Previously at theme root, which REPLACED Tailwind's defaults.
      // Now inside extend, so rounded-full, rounded-3xl, text-lg,
      // text-2xl, text-4xl etc. all work again, AND your custom
      // overrides still apply at the sizes you specified.
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
        // Tailwind defaults for 3xl, full, none are now preserved.
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.825rem", { lineHeight: "1.2rem" }],
        base: ["0.95rem", { lineHeight: "1.5rem" }],
        // Tailwind defaults for lg through 9xl are now preserved.
      },
    },
  },
  plugins: [animate],
} satisfies Config;