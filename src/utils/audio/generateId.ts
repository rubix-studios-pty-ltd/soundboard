export function generateId(filename: string): string {
  const numberText = [
    'Zero',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
  ]

  return filename
    .replace(/^sound[\\/]/, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/^\d+/, '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((part, index) => {
      const normalized = part
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')

      if (/^\d+$/.test(normalized)) {
        const value = Number(normalized)

        if (value >= 0 && value <= 10) {
          return numberText[value]
        }
      }

      const lower = normalized.toLowerCase()

      return index === 0
        ? lower
        : lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
}
