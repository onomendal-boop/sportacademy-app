const sansFallback = [
    "ui-sans-serif",
    "system-ui",
    "sans-serif",
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "Noto Color Emoji",
];

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./app/**/*.{js,jsx}",
        "./components/**/*.{js,jsx}",
        "./lib/**/*.{js,jsx}",
        "./hooks/**/*.{js,jsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "1rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                ring: "hsl(var(--ring) / <alpha-value>)",
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",

                // Palet biru laut AAA Sport Academy.
                // Nilai utama brand berada pada ocean.600 / primary: #0066CC.
                ocean: {
                    50: "#F0F7FF",
                    100: "#E0F0FF",
                    200: "#C2E0FF",
                    300: "#8FC7FF",
                    400: "#47A3FF",
                    500: "#007FFF",
                    600: "#0066CC",
                    700: "#0052A3",
                    800: "#003D7A",
                    900: "#002952",
                    950: "#001933",
                },

                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground:
                        "hsl(var(--primary-foreground) / <alpha-value>)",
                    50: "#F0F7FF",
                    100: "#E0F0FF",
                    200: "#C2E0FF",
                    300: "#8FC7FF",
                    400: "#47A3FF",
                    500: "#007FFF",
                    600: "#0066CC",
                    700: "#0052A3",
                    800: "#003D7A",
                    900: "#002952",
                    950: "#001933",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
                    foreground:
                        "hsl(var(--secondary-foreground) / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
                    foreground:
                        "hsl(var(--destructive-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover) / <alpha-value>)",
                    foreground:
                        "hsl(var(--popover-foreground) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                },
                chart: {
                    1: "hsl(var(--chart-1) / <alpha-value>)",
                    2: "hsl(var(--chart-2) / <alpha-value>)",
                    3: "hsl(var(--chart-3) / <alpha-value>)",
                    4: "hsl(var(--chart-4) / <alpha-value>)",
                    5: "hsl(var(--chart-5) / <alpha-value>)",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
                    foreground:
                        "hsl(var(--sidebar-foreground) / <alpha-value>)",
                    primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
                    "primary-foreground":
                        "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
                    accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
                    "accent-foreground":
                        "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
                    border: "hsl(var(--sidebar-border) / <alpha-value>)",
                    ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
                },
            },

            fontFamily: {
                sans: ["var(--font-inter)", "Inter", ...sansFallback],
                inter: ["var(--font-inter)", "Inter", ...sansFallback],
                heading: [
                    "var(--font-manrope)",
                    "Manrope",
                    "var(--font-inter)",
                    ...sansFallback,
                ],
                display: [
                    "var(--font-manrope)",
                    "Manrope",
                    "var(--font-inter)",
                    ...sansFallback,
                ],
                manrope: [
                    "var(--font-manrope)",
                    "Manrope",
                    "var(--font-inter)",
                    ...sansFallback,
                ],
            },

            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },

            boxShadow: {
                soft: "0 8px 30px rgb(0 41 82 / 0.08)",
                card: "0 12px 40px -12px rgb(0 41 82 / 0.18)",
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
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "slide-up": {
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.2s ease-out",
                "slide-up": "slide-up 0.25s ease-out",
            },
        },
    },
    // Runtime memakai Tailwind CSS v4; animasi utilitas disediakan oleh
    // `tw-animate-css` yang diimpor dari app/globals.css, bukan plugin v3.
    plugins: [],
};
