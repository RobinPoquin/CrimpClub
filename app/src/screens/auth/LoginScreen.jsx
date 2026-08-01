import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Image
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { signIn } from '../../../lib/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Remplis tous les champs.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn({ email, password });
      // La session est détectée automatiquement par App.js via onAuthStateChange
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    // KeyboardAvoidingView remonte le contenu quand le clavier apparaît
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Crimp<Text style={{ color: colors.accent }}>Club</Text>
        </Text>

        <Text style={styles.subtitle}>Content de te revoir 👋</Text>

        <Text style={styles.quote}>
          "Le meilleur grimpeur n'est pas celui qui grimpe les plus grosses cotations mais celui qui prend le plus de plaisir"
        </Text>

        {/* Champs */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="toi@email.com"
            placeholderTextColor={colors.light.textMuted}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.light.textMuted}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry
            autoComplete="password"
          />

          {/* Erreur */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Bouton connexion */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Se connecter</Text>
            }
          </TouchableOpacity>

          {/* Mot de passe oublié */}
          <TouchableOpacity
            style={styles.linkWrap}
            onPress={() => navigation.navigate('Forgot')}
          >
            <Text style={styles.link}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Inscription */}
          <View style={styles.switchWrap}>
            <Text style={styles.switchText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.link, { fontWeight: typography.bold }]}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.light.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.black,
    letterSpacing: -1,
    color: colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.light.textSecondary,
    marginBottom: spacing.sm,
  },
  quote: {
    fontSize: typography.xs,
    color: colors.light.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.light.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.light.bgInput,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.base,
    color: colors.light.textPrimary,
    marginBottom: spacing.md,
  },
  error: {
    fontSize: typography.sm,
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: colors.light.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: '#fff',
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  linkWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  link: {
    color: colors.accent,
    fontSize: typography.sm,
  },
  switchWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  switchText: {
    fontSize: typography.sm,
    color: colors.light.textSecondary,
  },
});