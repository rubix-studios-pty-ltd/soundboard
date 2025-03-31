import React from 'react';

interface ToggleSwitchProps {
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ icon, checked, onChange }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-4 h-4 text-black">
        {icon}
      </div>
      <input 
        type="checkbox" 
        className="toggle-switch mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
};

export default ToggleSwitch;
