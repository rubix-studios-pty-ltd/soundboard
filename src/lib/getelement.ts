const getEl = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Element with ID "${id}" not found`)
  return el as T
}

export default getEl
