import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

interface ToggleSwitchProps {
  icon: React.ReactNode;
  title?: string;
  text?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ icon, title, text, checked, onChange }) => {
  return (
    <div className="flex flex-col items-center">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="w-4 h-4 text-black cursor-pointer">
            {icon}
          </div>
        </HoverCardTrigger>
        {text &&
          <HoverCardContent className="max-w-80 p-3">
            <div className="flex flex-col justify-between gap-2">
              {title &&
                <span className="text-sm font-semibold">
                  {title}
                </span>
              }
              <p className="text-sm">
                {text}
              </p>
            </div>
          </HoverCardContent>
        }
      </HoverCard>
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
