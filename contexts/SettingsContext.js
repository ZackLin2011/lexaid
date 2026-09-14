import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// global settings for the whole app (theme, font size, reduce motion, notifications).
// they are saved in AsyncStorage so it survives restart.
const SETTINGS_KEY = 'settings';

const defaultSettings = {
  themeMode: 'system',
  fontScale: 1,
  reduceMotion: false,
  courtReminders: { '7d': true, '24h': true, '2h': true },
  taskReminders: true,
  vibration: true,
};

export const SettingsContext = createContext({
  ...defaultSettings,
  setThemeMode: () => {},
  setFontScale: () => {},
  setReduceMotion: () => {},
  setCourtReminders: () => {},
  setTaskReminders: () => {},
  setVibration: () => {},
  isSystemDark: false,
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const systemTheme = useSystemColorScheme();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
          setSettings(prev => ({ ...prev, ...JSON.parse(storedSettings) }));
        }
      } catch (e) {
        console.error('Failed to load settings.', e);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {
        console.error('Failed to save settings.', e);
      }
    };
    saveSettings();
  }, [settings]);

  const setThemeMode = (mode) => setSettings(s => ({ ...s, themeMode: mode }));
  const setFontScale = (scale) => setSettings(s => ({ ...s, fontScale: scale }));
  const setReduceMotion = (reduce) => setSettings(s => ({ ...s, reduceMotion: reduce }));
  const setCourtReminders = (reminders) => setSettings(s => ({ ...s, courtReminders: reminders }));
  const setTaskReminders = (remind) => setSettings(s => ({ ...s, taskReminders: remind }));
  const setVibration = (vibrate) => {
    if (vibrate) {
        Vibration.vibrate(100);
    }
    setSettings(s => ({ ...s, vibration: vibrate }));
  }

  const value = useMemo(() => ({
    ...settings,
    setThemeMode,
    setFontScale,
    setReduceMotion,
    setCourtReminders,
    setTaskReminders,
    setVibration,
    isSystemDark: systemTheme === 'dark',
  }), [settings, systemTheme]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

export const useScaledFontSize = () => {
    const { fontScale } = useSettings();
    return useCallback((baseSize) => {
        return Math.round(baseSize * fontScale);
    }, [fontScale]);
};