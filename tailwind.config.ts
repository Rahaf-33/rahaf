import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: { DEFAULT: "#FBF8F3", deep: "#F4EFE6" },
        ink: { DEFAULT: "#2F3437", soft: "#5B6266", mute: "#8A9094" },
        sage: { 50: "#F1F5F1", 100: "#E2EBE2", 200: "#C9D8C9", 400: "#93AE95", 500: "#7A9A7E", 600: "#5F7F64", 700: "#4A654F" },
        petrol: { 50: "#EEF4F5", 100: "#DCE9EB", 200: "#B9D2D6", 400: "#6F9AA2", 500: "#4F7F89", 600: "#3D6770", 700: "#2F525A" },
        peach: { 50: "#FCF3EF", 100: "#F8E4DB", 200: "#F1CDBE", 400: "#E2A58E", 500: "#D98C73" },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', "Tajawal", "system-ui", "sans-serif"],
        display: ["Tajawal", '"IBM Plex Sans Arabic"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(47,52,55,0.04), 0 6px 24px -12px rgba(47,52,55,0.12)",
        lift: "0 2px 4px rgba(47,52,55,0.04), 0 16px 40px -20px rgba(47,52,55,0.22)",
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        glow: { "0%": { boxShadow: "0 0 0 0 rgba(217,140,115,0.45)" }, "100%": { boxShadow: "0 0 0 14px rgba(217,140,115,0)" } },
      },
      animation: {
        rise: "rise .5s cubic-bezier(.2,.7,.2,1) both",
        glow: "glow 1.6s ease-out 2",
      },
    },
  },
  plugins: [],
} satisfies Config;
