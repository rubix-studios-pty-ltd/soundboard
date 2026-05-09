export function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Element with ID "${id}" not found`)
  return element as T
}
