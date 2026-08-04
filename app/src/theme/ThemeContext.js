import { createContext, useContext, useState } from 'react';
import { colors } from './index';
import { useColorScheme, LayoutAnimation, Platform, UIManager } from 'react-native';

// Active les animations sur Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Contexte global pour le thème
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Détecte le thème système par défaut
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState(systemTheme || 'light');

  // Couleurs actives selon le thème
  const palette = theme === 'dark' ? colors.dark : colors.light;

  function toggleTheme() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook pour utiliser le thème dans n'importe quel composant
export function useTheme() {
  return useContext(ThemeContext);
}