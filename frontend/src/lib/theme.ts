
export const theme = {
  /* =====================================================
     BRAND
     ===================================================== */

  brand: {
    name: "G-BYT",
    primary: "#0786AD",
    primaryDeep: "#05647F",
    primaryDark: "#03465B",
    primaryGlow: "#39D5F2",
    primarySoft: "#E3F8FC",

    accent: "#7C3AED",
    accentSoft: "#F1EAFE",
  },

  /* =====================================================
     COLORS
     ===================================================== */

  colors: {
    primary: "#0786AD",
    primaryDeep: "#05647F",
    primaryDark: "#03465B",
    primaryGlow: "#39D5F2",
    primarySoft: "#E3F8FC",

    accent: "#7C3AED",
    accentSoft: "#F1EAFE",

    success: "#12805C",
    successSoft: "#E5F7F0",

    warning: "#C47A16",
    warningSoft: "#FFF4DF",

    danger: "#D13939",
    dangerSoft: "#FDEAEA",

    light: {
      background: "#F5F8FA",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFFFF",
      surfaceSoft: "rgba(255, 255, 255, 0.78)",
      surfaceMuted: "#EEF4F6",

      text: "#0A1720",
      heading: "#07151D",

      muted: "#647984",
      mutedLight: "#8CA0AA",

      border: "#DBE7EB",
      borderStrong: "#C7D9DF",
    },

    dark: {
      background: "#060B11",
      surface: "#0C141D",
      surfaceElevated: "#101B26",
      surfaceSoft: "rgba(12, 20, 29, 0.78)",
      surfaceMuted: "#111D28",

      text: "#F3F9FB",
      heading: "#F6FBFC",

      muted: "#91A7B3",
      mutedLight: "#6E858F",

      border: "#1D303C",
      borderStrong: "#2A414E",
    },
  },

  /* =====================================================
     TYPOGRAPHY
     ===================================================== */

  typography: {
    fontFamily: {
      sans: [
        "var(--font-geist-sans)",
        "Inter",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "sans-serif",
      ].join(", "),

      mono: [
        "var(--font-geist-mono)",
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "monospace",
      ].join(", "),
    },

    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    letterSpacing: {
      tight: "-0.045em",
      heading: "-0.025em",
      normal: "0",
      relaxed: "0.01em",
    },
  },

  /* =====================================================
     BORDER RADIUS
     ===================================================== */

  radius: {
    sm: "8px",
    md: "12px",
    lg: "18px",
    xl: "24px",
    "2xl": "32px",
    full: "999px",
  },

  /* =====================================================
     SHADOWS
     ===================================================== */

  shadows: {
    xs: "0 1px 2px rgba(7, 21, 29, 0.04)",

    sm: "0 4px 14px rgba(7, 21, 29, 0.06)",

    md: "0 10px 30px rgba(7, 21, 29, 0.09)",

    lg: "0 20px 55px rgba(7, 21, 29, 0.13)",

    glow: "0 0 35px rgba(57, 213, 242, 0.18)",
  },

  /* =====================================================
     DARK MODE SHADOWS
     ===================================================== */

  darkShadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.20)",

    sm: "0 5px 18px rgba(0, 0, 0, 0.25)",

    md: "0 12px 35px rgba(0, 0, 0, 0.32)",

    lg: "0 24px 60px rgba(0, 0, 0, 0.45)",

    glow: "0 0 45px rgba(56, 201, 232, 0.12)",
  },

  /* =====================================================
     SPACING
     ===================================================== */

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
    "4xl": "64px",
    "5xl": "80px",
    "6xl": "96px",
  },

  /* =====================================================
     CONTAINER
     ===================================================== */

  container: {
    maxWidth: "1440px",

    padding: {
      mobile: "16px",
      tablet: "24px",
      desktop: "32px",
    },
  },

  /* =====================================================
     MOTION
     ===================================================== */

  motion: {
    duration: {
      fast: "180ms",
      normal: "220ms",
      slow: "260ms",
      slower: "500ms",
    },

    easing: {
      standard: "cubic-bezier(0.22, 1, 0.36, 1)",
      linear: "linear",
    },
  },

  /* =====================================================
     COMPONENTS
     ===================================================== */

  components: {
    button: {
      minHeight: "44px",
      borderRadius: "12px",
      fontWeight: 600,
    },

    input: {
      height: "46px",
      borderRadius: "12px",
    },

    card: {
      borderRadius: "18px",
      borderWidth: "1px",
    },

    productCard: {
      borderRadius: "24px",
      hoverTranslateY: "-5px",
      imageScale: "1.045",
    },

    badge: {
      borderRadius: "999px",
    },
  },

  /* =====================================================
     Z-INDEX
     ===================================================== */

  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    toast: 1500,
    tooltip: 1600,
  },
} as const;

export type Theme = typeof theme;

