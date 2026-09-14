import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

// app's root
// font size from settings is used to scale the header text
const AppContent = () => {
  const { themeMode, isSystemDark, fontScale } = useSettings();

  const currentTheme = themeMode === 'dark' || (themeMode === 'system' && isSystemDark) ? DarkTheme : DefaultTheme;

  const AppTheme = {
    ...currentTheme,
    colors: {
      ...currentTheme.colors,
      primary: 'rgb(0, 122, 255)',
    },
    fonts: {
      ...currentTheme.fonts,
      header: {
        ...currentTheme.fonts?.header,
        fontSize: Math.round(18 * fontScale),
      },
    },
  };

  return (
    <NavigationContainer theme={AppTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}