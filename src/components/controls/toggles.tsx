interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleSwitch({ checked, onChange }: ToggleProps) {
  return (
    <input
      type="checkbox"
      className="flex flex-col items-center toggle-switch mt-1"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  )
}
