import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Navigation from './src/navigation';
import AuthNavigator from './src/navigation/AuthNavigator';
import { supabase } from './lib/supabase';
import { colors } from './src/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifie si une session existe au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écoute les changements de session (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    <SafeAreaProvider>
      {user ? <Navigation user={user} /> : <AuthNavigator />}
    </SafeAreaProvider>
  );
}