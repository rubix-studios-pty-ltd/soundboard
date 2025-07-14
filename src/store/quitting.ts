let isQuitting = false

export function getIsQuitting(): boolean {
  return isQuitting
}

export function setIsQuitting(value: boolean): void {
  isQuitting = value
}
