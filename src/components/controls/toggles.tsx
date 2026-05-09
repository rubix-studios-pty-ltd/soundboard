interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function ToggleSwitch({
  checked,
  onChange,
}: ToggleSwitchProps) {
  return (
    <div className="flex flex-col items-center">
      <input
        type="checkbox"
        className="toggle-switch mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  )
}