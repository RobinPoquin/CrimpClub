import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { updateProfile, updatePassword } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { getAscents } from '../../../lib/db';
import AvatarUploader from '../../components/common/AvatarUploader';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Switch } from 'react-native';

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
  const [privateIsOn, setPrivateIsOn] = useState(false);
  const [user, setUser] = useState(null);

  // Charge les infos user au montage
  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      setDisplayName(u?.user_metadata?.display_name || '');
      setEmail(u?.email || '');
      setBio(u?.user_metadata?.bio || '');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', u.id)
        .single();
      setPrivateIsOn(profile?.is_private || false);
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateProfile({ displayName, email, bio, isPrivate: privateIsOn});
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
    const ascents = await getAscents(userId);
    const json = JSON.stringify(ascents, null, 2);
    const path = FileSystem.cacheDirectory + 'CrimpClubExport.json';
    await FileSystem.writeAsStringAsync(path, json);
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Exporter le logbook' });
  }

  // Exporte toutes les ascensions au format CSV (compatible Excel/Google Sheets)
  async function exportCSV() {
    const ascents = await getAscents(userId);
    //Crée le contenu CSV
    const headers = ["Date", "Type", "Cotation", "Couleur", "Cotation indicative", "Résultat", "Localisation", "Extérieur ?", "Nom", "Commentaire",];
    const rows = ascents.map(a => [
      a.date      || "",
      a.type      || "",
      a.grade     || "",
      a.colorName || "",
      a.gradeHint || "",
      a.result    || "",
      a.location  || "",
      a.outdoor ? "Oui" : "Non",
      a.routeName || "",
      // Échappe les guillemets pour éviter que les virgules cassent le CSV
      a.comment ? `"${a.comment.replace(/"/g, '""')}"` : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
    //Écrit le fichier sur le téléphone
    const path = FileSystem.cacheDirectory + 'CrimpClubExport.csv';

    await FileSystem.writeAsStringAsync(path, csv);
      
    //Ouvre la feuille de partage
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Exporter le logbook' });
    
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View>
                <Text style={styles.label}>{privateIsOn ? "Compte privé" : "Compte public"}</Text>
                <Text style={{ fontSize: typography.xs, color: palette.textMuted, marginTop: 2 }}>
                  {privateIsOn ? "Seuls tes followers voient ton profil" : "Tout le monde peut voir ton profil"}
                </Text>
              </View>
              <Switch
                value={privateIsOn}
                onValueChange={v => setPrivateIsOn(v)}
                trackColor={{ true: colors.accent }}
                thumbColor="#fff"
              />
            </View>

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
            <TouchableOpacity style={styles.btn} onPress={exportCSV}>
              <Text style={styles.btnText}>⬇️ Exporter en CSV</Text>
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