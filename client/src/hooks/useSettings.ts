import { useState, useEffect } from 'react';

interface Settings {
  fontScale: number; // 1 to 2
  highContrast: boolean;
  darkMode: boolean;
  reduceMotion: boolean;
}

const defaults: Settings = {
  fontScale: 1,
  highContrast: false,
  darkMode: false,
  reduceMotion: false,
};

function load(): Settings {
  try {
    const stored = localStorage.getItem('settings');
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));

    // Apply font scale
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale));

    // Apply dark mode
    document.documentElement.classList.toggle('dark', settings.darkMode);

    // Apply high contrast
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);

    // Apply reduce motion
    if (settings.reduceMotion) {
      document.documentElement.style.setProperty('--motion-reduce', '1');
    } else {
      document.documentElement.style.removeProperty('--motion-reduce');
    }
  }, [settings]);

  const update = (partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return { settings, update };
}
