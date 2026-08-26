import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Navigation from './src/navigation';
import AuthNavigator from './src/navigation/AuthNavigator';
import { supabase } from './lib/supabase';
import { colors } from './src/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import ThemedStatusBar from './src/components/common/ThemedStatusBar';
import { savePushToken } from './lib/auth';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  //Retourne le Token de notification
  async function getPushToken () {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      return pushTokenString;
    } catch (e) {
    }
  }

  useEffect(() => {
    // Vérifie si une session existe au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écoute les changements de session (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (_event === 'SIGNED_IN') {
        async function registerToken() {
          const token = await getPushToken();
          await savePushToken({ userId: session?.user?.id, pushToken: token });
        }
        registerToken();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Écran de chargement initial
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Si connecté → app principale, sinon → auth
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ThemedStatusBar />
        {user ? <Navigation user={user} /> : <AuthNavigator />}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}