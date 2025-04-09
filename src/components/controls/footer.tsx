import React from 'react';
import { ThemePicker } from '@/components/ui/theme-picker';
import { useSettings } from '@/context/setting';
import { presetThemes } from '@/data/themes';

const Footer: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const handleThemeChange = (themeKey: string | null) => {
    if (themeKey === null) {
      updateSettings({
        theme: {
          ...settings.theme,
          enabled: false
        }
      });
      return;
    }

    const theme = presetThemes[themeKey];
    updateSettings({
      theme: {
        enabled: true,
        ...theme
      }
    });
  };

  return (
    <div className="bg-white flex items-center justify-between p-1 sticky bottom-0 z-50 border-t border-gray-200">
      <p className="text-[9px] p-1">
        <span className="mr-0.5">&copy;2025</span> 
        <a 
          href="https://www.rubixstudios.com.au" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-black font-bold no-underline hover:no-underline"
        >
          Rubix Studios
        </a>
      </p>
      <div className="flex items-center gap-2">
        <ThemePicker
          onThemeChange={handleThemeChange}
        />
      </div>
    </div>
  );
};

export default Footer;
