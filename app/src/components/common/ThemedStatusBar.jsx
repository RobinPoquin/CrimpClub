import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../theme/ThemeContext';

// StatusBar qui suit le thème de l'app
export default function ThemedStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}