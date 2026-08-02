// Système de design CrimpClub
// Équivalent du CSS en web

export const colors = {
  // Couleurs principales
  accent:      "#22C55E",  // vert CrimpClub
  accentDim:   "#DCFCE7",
  accentText:  "#15803D",
  danger:      "#EF4444",
  warn:        "#F59E0B",
  blue:        "#3B82F6",

  // Résultats
  flash:       "#3B82F6",
  worked:      "#F59E0B",

  //Tags
  accentDim:  "#DCFCE7",
  accentText: "#15803D",

  // Niveaux couleur normalisés
  n1: "#FACC15", // jaune
  n2: "#22C55E", // vert
  n3: "#3B82F6", // bleu
  n4: "#EF4444", // rouge
  n5: "#3F3F46", // noir
  n6: "#7C3AED", // violet

  // Light mode
  light: {
    bg:          "#FAFAF8",
    bgCard:      "#FFFFFF",
    bgInput:     "#F4F4F1",
    border:      "#E4E4E0",
    textPrimary: "#18181B",
    textSecondary: "#71717A",
    textMuted:   "#A1A1AA",
  },

  // Dark mode
  dark: {
    bg:          "#09090B",
    bgCard:      "#18181B",
    bgInput:     "#27272A",
    border:      "#3F3F46",
    textPrimary: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textMuted:   "#71717A",
  },
};

export const typography = {
  // Tailles de police
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  28,
  hero: 36,

  // Graisses
  regular:  "400",
  medium:   "500",
  semibold: "600",
  bold:     "700",
  black:    "900",
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 16,
  full: 9999, // pour les pills et avatars
};