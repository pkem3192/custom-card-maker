export const LETTER_LANDSCAPE = {
  widthInches: 11,
  heightInches: 8.5,
  documentWidth: 1100,
  documentHeight: 850,
  printWidth: 3300,
  printHeight: 2550,
  exportMultiplier: 3,
  foldX: 550,
  safeMargin: 36
} as const;

export const PANEL_LABELS = {
  outside: {
    left: "Back Cover",
    right: "Front Cover"
  },
  inside: {
    left: "Inside Left",
    right: "Inside Right"
  }
} as const;
