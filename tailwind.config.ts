import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["'DM Serif Display'", "Georgia", "serif"],
        sans: ["'Syne'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'DM Mono'", "'SF Mono'", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        vanta: {
          bg: "hsl(var(--vanta-bg))",
          "bg-elevated": "hsl(var(--vanta-bg-elevated))",
          text: "hsl(var(--vanta-text))",
          "text-mid": "hsl(var(--vanta-text-mid))",
          "text-low": "hsl(var(--vanta-text-low))",
          "text-muted": "hsl(var(--vanta-text-muted))",
          accent: "hsl(var(--vanta-accent))",
          "accent-bg": "hsl(var(--vanta-accent-bg))",
          "accent-border": "hsl(var(--vanta-accent-border))",
          "accent-faint": "hsl(var(--vanta-accent-faint))",
          border: "hsl(var(--vanta-border))",
          "border-mid": "hsl(var(--vanta-border-mid))",
          "bubble-in": "hsl(var(--vanta-bubble-in))",
          "bubble-in-border": "hsl(var(--vanta-bubble-in-border))",
          "bubble-out": "hsl(var(--vanta-bubble-out))",
          "bubble-out-border": "hsl(var(--vanta-bubble-out-border))",
          "accent-teal": "hsl(var(--vanta-accent-teal))",
          "accent-teal-faint": "hsl(var(--vanta-accent-teal-faint))",
          "accent-teal-border": "hsl(var(--vanta-accent-teal-border))",
          "accent-amber": "hsl(var(--vanta-accent-amber))",
          "accent-amber-faint": "hsl(var(--vanta-accent-amber-faint))",
          "accent-amber-border": "hsl(var(--vanta-accent-amber-border))",
          "accent-violet": "hsl(var(--vanta-accent-violet))",
          "accent-violet-faint": "hsl(var(--vanta-accent-violet-faint))",
          "accent-violet-border": "hsl(var(--vanta-accent-violet-border))",
          "accent-zoom": "hsl(var(--vanta-accent-zoom))",
          "accent-zoom-faint": "hsl(var(--vanta-accent-zoom-faint))",
          "accent-zoom-border": "hsl(var(--vanta-accent-zoom-border))",
        },
      },
      borderRadius: {
        lg: "0px",
        md: "0px",
        sm: "0px",
        DEFAULT: "0px",
      },
      transitionTimingFunction: {
        drawer: "cubic-bezier(0.32, 0, 0.15, 1)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-up-1": "fadeUp 0.5s ease 0.06s forwards",
        "fade-up-2": "fadeUp 0.5s ease 0.12s forwards",
        "fade-up-3": "fadeUp 0.5s ease 0.18s forwards",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
