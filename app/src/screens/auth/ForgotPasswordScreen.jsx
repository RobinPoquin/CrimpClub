import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Image
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { sendPasswordReset } from '../../../lib/auth';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  async function handleReset() {
    if (!email.trim()) { setError('Entre ton adresse email.'); return; }
    setLoading(true);
    setError('');
    try {
      await sendPasswordReset(email);
      setSent(true);
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

        {sent ? (
          /* Confirmation envoi email */
          <View style={styles.sentWrap}>
            <Text style={styles.sentIcon}>📬</Text>
            <Text style={styles.sentTitle}>Email envoyé !</Text>
            <Text style={styles.sentSub}>
              Un lien de réinitialisation a été envoyé à{' '}
              <Text style={{ fontWeight: typography.bold }}>{email}</Text>.
              Vérifie tes spams si tu ne le vois pas.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.btnText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Entre ton email et on t'enverra un lien pour réinitialiser ton mot de passe.
            </Text>

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

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Envoyer le lien</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkWrap}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.link}>← Retour à la connexion</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: spacing.xl,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.light.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
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
  },
  link: {
    color: colors.accent,
    fontSize: typography.sm,
  },
  sentWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  sentIcon: {
    fontSize: 48,
  },
  sentTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.light.textPrimary,
  },
  sentSub: {
    fontSize: typography.sm,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});