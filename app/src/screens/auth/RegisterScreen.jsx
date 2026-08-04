import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Image
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { signUp } from '../../../lib/auth';
import { useTheme } from '../../theme/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const { palette } = useTheme();
  const styles = makeStyles(palette);

  async function handleRegister() {
    if (!displayName.trim()) { setError('Entre ton prénom ou pseudo.'); return; }
    if (!email.trim())       { setError('Entre ton email.'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min.).'); return; }
    setLoading(true);
    setError('');
    try {
      await signUp({ email, password, displayName });
      // La session est détectée automatiquement par App.js
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Crimp<Text style={{ color: colors.accent }}>Club</Text>
        </Text>

        <Text style={styles.subtitle}>Crée ton logbook gratuitement.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Prénom ou pseudo</Text>
          <TextInput
            style={styles.input}
            placeholder="ex. Martin"
            placeholderTextColor={palette.textMuted}
            value={displayName}
            onChangeText={t => { setDisplayName(t); setError(''); }}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="toi@email.com"
            placeholderTextColor={palette.textMuted}
            value={email}
            onChangeText={t => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="6 caractères minimum"
            placeholderTextColor={palette.textMuted}
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <View style={styles.switchWrap}>
            <Text style={styles.switchText}>Déjà inscrit ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: palette.bg,
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
      color: palette.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: typography.base,
      color: palette.textSecondary,
      marginBottom: spacing.xl,
    },
    form: {
      width: '100%',
    },
    label: {
      fontSize: typography.sm,
      fontWeight: typography.semibold,
      color: palette.textSecondary,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: palette.bgInput,
      borderWidth: 1.5,
      borderColor: palette.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: typography.base,
      color: palette.textPrimary,
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
      backgroundColor: palette.textMuted,
      shadowOpacity: 0,
      elevation: 0,
    },
    btnText: {
      color: '#fff',
      fontSize: typography.base,
      fontWeight: typography.bold,
    },
    switchWrap: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    switchText: {
      fontSize: typography.sm,
      color: palette.textSecondary,
    },
    link: {
      color: colors.accent,
      fontSize: typography.sm,
      fontWeight: typography.bold,
    },
  });
}