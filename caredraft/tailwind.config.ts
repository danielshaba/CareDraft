import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CareDraft Brand Colors - Updated Brand Palette (Accessibility Improved)
        brand: {
          // Primary Soft Teal - Adjusted for WCAG AA compliance
          primary: '#2A6F6F', // Darkened for better contrast (was #3B9C9C)
          'primary-dark': '#1F4949', // Even darker for emphasis
          'primary-light': '#EAF7F7',
          // Semantic aliases
          teal: '#2A6F6F', // Updated to match primary
          'teal-dark': '#1F4949', 
          'teal-light': '#EAF7F7',
          // Full teal scale based on primary color
          50: '#EAF7F7',
          100: '#D5F0F0', 
          200: '#ABE0E0',
          300: '#81D1D1',
          400: '#5DB1B1',
          500: '#2A6F6F', // Primary Teal (darkened for accessibility)
          600: '#1F4949', // Darker Teal (Accent/Depth)
          700: '#255C5C',
          800: '#1F4949',
          900: '#1A3636',
          950: '#0F2323',
        },
        // Neutral colors for text and backgrounds
        neutral: {
          dark: '#333333',    // For body text and high-contrast accessibility
          light: '#F5F5F5',   // For subtle borders or page background
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#333333',     // Neutral Dark
          900: '#262626',
          950: '#171717',
        },
        // Backward compatibility - keep teal as alias to brand
        teal: {
          50: '#EAF7F7',
          100: '#D5F0F0', 
          200: '#ABE0E0',
          300: '#81D1D1',
          400: '#5DB1B1',
          500: '#2A6F6F', // Primary Teal (darkened for accessibility)
          600: '#1F4949', // Darker Teal (Accent/Depth)
          700: '#255C5C',
          800: '#1F4949',
          900: '#1A3636',
          950: '#0F2323',
        },
        // Additional neutral colors for better design
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#2A6F6F", // Updated to use accessible brand primary color
          foreground: "#ffffff",
          50: '#EAF7F7',
          100: '#D5F0F0', 
          200: '#ABE0E0',
          300: '#81D1D1',
          400: '#5DB1B1',
          500: '#2A6F6F',
          600: '#1F4949',
          700: '#255C5C',
          800: '#1F4949',
          900: '#1A3636',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Open Sans', 'ui-serif', 'Georgia'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config; 