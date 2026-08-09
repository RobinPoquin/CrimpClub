import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { updateProfile, updatePassword } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { getAscents } from '../../../lib/db';
import AvatarUploader from '../../components/common/AvatarUploader';

export default function SettingsScreen({ navigation, route }) {
  const userId = route?.params?.userId;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [tab, setTab]               = useState('profile');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]           = useState('');
  const [bio, setBio]               = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [user, setUser] = useState(null);

  // Charge les infos user au montage
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
        setUser(u);
        setDisplayName(u?.user_metadata?.display_name || '');
        setEmail(u?.email || '');
        setBio(u?.user_metadata?.bio || '');
    });
  }, []);

  async function handleSaveProfile() {
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateProfile({ displayName, email, bio });
      setSuccess('Profil mis à jour !');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword() {
    if (password.length < 6) { setError('Mot de passe trop court.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await updatePassword(password);
      setSuccess('Mot de passe mis à jour !');
      setPassword(''); setConfirm('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExportJSON() {
    const data = await getAscents(userId);
    Alert.alert('Export JSON', `${data.length} ascensions prêtes — fonctionnalité complète bientôt disponible.`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      {/* Onglets */}
      <View style={{ flexDirection: 'row', backgroundColor: palette.bgInput, margin: spacing.lg, borderRadius: radius.md, padding: 3, gap: 3 }}>
        {['profile', 'password', 'data'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => { setTab(t); setError(''); setSuccess(''); }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'profile' ? 'Compte' : t === 'password' ? 'Mot de passe' : 'Données'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        {/* Onglet Compte */}
        {tab === 'profile' && (
          <>
            {/* Photo de profil */}
            <Text style={styles.label}>Photo de profil</Text>
            <AvatarUploader
            userId={userId}
            currentUrl={user?.user_metadata?.avatar_url}
            folder="avatars"
            size={72}
            placeholder="👤"
            onUploaded={async url => {
                await updateProfile({ displayName, email, bio, avatarUrl: url });
            }}
            />
            <Text style={styles.label}>Prénom ou pseudo</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholderTextColor={palette.textMuted} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={palette.textMuted} />

            <Text style={styles.label}>Bio <Text style={styles.optional}>(optionnel)</Text></Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} multiline placeholderTextColor={palette.textMuted} />

            <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enregistrer</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Onglet Mot de passe */}
        {tab === 'password' && (
          <>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={palette.textMuted} placeholder="6 caractères minimum" />

            <Text style={styles.label}>Confirmer</Text>
            <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholderTextColor={palette.textMuted} placeholder="Répète le mot de passe" />

            <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleSavePassword} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Changer le mot de passe</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* Onglet Données */}
        {tab === 'data' && (
          <>
            <Text style={{ fontSize: typography.sm, color: palette.textSecondary, marginBottom: spacing.md }}>
              Télécharge une copie de toutes tes ascensions.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={handleExportJSON}>
              <Text style={styles.btnText}>⬇️ Exporter en JSON</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg },
    header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border, backgroundColor: palette.bgCard },
    back:      { fontSize: typography.base, color: colors.accent, fontWeight: typography.semibold },
    title:     { fontSize: typography.lg, fontWeight: typography.black, color: palette.textPrimary },
    tab:       { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
    tabActive: { backgroundColor: palette.bgCard },
    tabText:   { fontSize: typography.xs, fontWeight: typography.semibold, color: palette.textMuted },
    tabTextActive: { color: palette.textPrimary },
    content:   { padding: spacing.lg },
    label:     { fontSize: typography.sm, fontWeight: typography.semibold, color: palette.textSecondary, marginBottom: spacing.xs },
    optional:  { fontWeight: '400', color: palette.textMuted },
    input:     { backgroundColor: palette.bgInput, borderWidth: 1.5, borderColor: palette.border, borderRadius: radius.md, padding: spacing.md, fontSize: typography.base, color: palette.textPrimary, marginBottom: spacing.md },
    btn:       { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
    btnDisabled: { backgroundColor: palette.textMuted },
    btnText:   { color: '#fff', fontSize: typography.base, fontWeight: typography.bold },
    error:     { fontSize: typography.sm, color: colors.danger, backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
    success:   { fontSize: typography.sm, color: colors.accentText, backgroundColor: '#DCFCE7', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  });
}