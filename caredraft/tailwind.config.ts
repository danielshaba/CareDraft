import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // CareDraft Official Brand Colors (Updated to align with #2A6F6F)
        brand: {
          50: '#f0fdfd',   // Very light teal
          100: '#ccfbf1',  // Light mint
          200: '#99f6e4',  // Lighter teal
          300: '#5eead4',  // Medium light teal
          400: '#2dd4bf',  // Medium teal
          500: '#2A6F6F',  // Official CareDraft primary color
          600: '#2A6F6F',  // Official CareDraft primary color
          700: '#236060',  // Darker official teal
          800: '#1a4848',  // Very dark teal
          900: '#133838',  // Darkest teal
        },
        'brand-primary': {
          50: '#f0fdfd',
          100: '#ccfbf1', 
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#2A6F6F',  // Official CareDraft primary #2A6F6F
          600: '#2A6F6F',  // Official CareDraft primary #2A6F6F
          700: '#236060',  // Darker official teal
          800: '#1a4848',  // Very dark teal
          900: '#133838',  // Darkest teal
        },
        'brand-accent': {
          50: '#f0fdfd',
          100: '#ccfbf1',
          200: '#99f6e4', 
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#2A6F6F',  // Official CareDraft primary #2A6F6F
          600: '#2A6F6F',  // Official CareDraft primary #2A6F6F
          700: '#236060',  // Darker official teal
          800: '#1a4848',  // Very dark teal
          900: '#133838',  // Darkest teal
        },
        'brand-secondary': {
          50: '#EAF7F7',   // Official light teal #EAF7F7
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Neutral grays for consistency
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        // Shadcn/UI color variables
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        '4': '1rem',
        '6': '1.5rem', 
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
        // Layout specific spacing
        'sidebar': '240px',
        'topbar': '64px',
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
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config; 