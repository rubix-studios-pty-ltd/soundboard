export function generateSoundId(filename: string): string {
  const baseName = filename.replace(/^sound\//, "").replace(/\.opus$/, "")

  let nameWithoutPrefix = baseName.replace(/^\d+/, "")

  const parts = nameWithoutPrefix.split(/[-_]/)

  const processedParts = parts.map((part, index) => {
    if (!part) {
      return ""
    }

    if (/^\d+$/.test(part)) {
      const num = parseInt(part)
      const numberWords = [
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
      ]
      if (num > 0 && num <= 10) {
        return numberWords[num - 1]
      }
    }

    const normalized = part
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")

    return index === 0
      ? normalized.toLowerCase()
      : normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
  })

  return processedParts.join("")
}
