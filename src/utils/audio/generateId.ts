const numbers = [
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
] as const

function normalizePart(part: string): string {
  return part
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export function generateId(filename: string): string {
  const cleaned = filename
    .replace(/^sound[\\/]/, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/^\d+/, '')

  const parts = cleaned.split(/[-_]/).filter(Boolean)

  return parts
    .map((part, index) => {
      const normalized = normalizePart(part)

      if (/^\d+$/.test(normalized)) {
        const value = Number(normalized)

        if (value >= 0 && value <= 10) {
          return numbers[value]
        }
      }

      const lower = normalized.toLowerCase()

      if (index === 0) {
        return lower
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
}
