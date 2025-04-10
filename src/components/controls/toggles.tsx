import React from "react"

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => {
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

export default ToggleSwitch
