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
    buttonActive: "#274158",
    buttonHoverColor: "#274158",
  },
  green: {
    name: "Green",
    backgroundColor: "#F5EBDE",
    buttonColor: "#023F3D",
    buttonText: "#ffffff",
    buttonActive: "#0A716D",
    buttonHoverColor: "#0A716D",
  },
  lightgreen: {
    name: "Light Green",
    backgroundColor: "#FFFFFF",
    buttonColor: "#669694",
    buttonText: "#ffffff",
    buttonActive: "#94BEBC",
    buttonHoverColor: "#94BEBC",
  },
  pink: {
    name: "Pink",
    backgroundColor: "#FFFBFA",
    buttonColor: "#FEDBD0",
    buttonText: "#442C2E",
    buttonActive: "#FEEAE6",
    buttonHoverColor: "#FEEAE6",
  },
  cream: {
    name: "Cream",
    backgroundColor: "#FBE0D5",
    buttonColor: "#CB94BC",
    buttonText: "#FFFFFF",
    buttonActive: "#DBBEE2",
    buttonHoverColor: "#DBBEE2",
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
    buttonColor: "#F5C249",
    buttonText: "#16171B",
    buttonActive: "#F7C865",
    buttonHoverColor: "#F7C865",
  },
}
