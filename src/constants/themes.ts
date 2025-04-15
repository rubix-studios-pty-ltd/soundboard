export const buttonPreset = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#06b6d4",
]

export interface ThemePreset {
  name: string
  backgroundColor: string
  buttonColor: string
  buttonText: string
  buttonActive: string
  buttonHoverColor: string
}

export const presetThemes: Record<string, ThemePreset> = {
  blue: {
    name: "Blue",
    backgroundColor: "#070B14",
    buttonColor: "#143153",
    buttonText: "#F0F6FF",
    buttonActive: "#000000",
    buttonHoverColor: "#274158",
  },
  green: {
    name: "Green",
    backgroundColor: "#F5EBDE",
    buttonColor: "#023F3D",
    buttonText: "#ffffff",
    buttonActive: "#008a85",
    buttonHoverColor: "#0A716D",
  },
  lightgreen: {
    name: "Light Green",
    backgroundColor: "#FFFFFF",
    buttonColor: "#0e7f7a",
    buttonText: "#ffffff",
    buttonActive: "#000000",
    buttonHoverColor: "#588684",
  },
  cream: {
    name: "Cream",
    backgroundColor: "#FFFBFA",
    buttonColor: "#FEDBD0",
    buttonText: "#442C2E",
    buttonActive: "#e7baac",
    buttonHoverColor: "#FEEAE6",
  },
  pink: {
    name: "Pink",
    backgroundColor: "#FBE0D5",
    buttonColor: "#c260a8",
    buttonText: "#FFFFFF",
    buttonActive: "#912c78",
    buttonHoverColor: "#e684cd",
  },
  red: {
    name: "Red",
    backgroundColor: "#F8F7F7",
    buttonColor: "#E12C87",
    buttonText: "#FFFFFF",
    buttonActive: "#F55D5B",
    buttonHoverColor: "#F55D5B",
  },
  yellow: {
    name: "Yellow",
    backgroundColor: "#16171B",
    buttonColor: "#ffce65",
    buttonText: "#16171B",
    buttonActive: "#f5ad02",
    buttonHoverColor: "#ffbc2b",
  },
}
