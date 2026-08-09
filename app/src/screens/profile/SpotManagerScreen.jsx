import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getLocations, saveLocation, deleteLocationByName } from '../../../lib/locations';
import AvatarUploader from '../../components/common/AvatarUploader';

export default function SpotManagerScreen({ navigation, route }) {
  const userId = route?.params?.userId;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [spots, setSpots]             = useState([]);
  const [editing, setEditing]         = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Charge les spots au focus
  useFocusEffect(
    useCallback(() => {
      getLocations(userId).then(data => setSpots(data.filter(l => l.is_outdoor)));
    }, [userId])
  );

  async function handleSave() {
    if (!editing.name.trim()) { setError('Donne un nom au spot.'); return; }
    setSaving(true); setError('');
    try {
      // Si modification, supprime l'ancien d'abord
      if (editing.id) {
        const original = spots.find(s => s.id === editing.id);
        if (original?.name !== editing.name) {
          await deleteLocationByName(userId, original.name);
        }
      }
      await saveLocation(userId, editing.name, true, editing.types, editing.logoUrl);
      const data = await getLocations(userId);
      setSpots(data.filter(l => l.is_outdoor));
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteLocationByName(userId, confirmDelete);
    const data = await getLocations(userId);
    setSpots(data.filter(l => l.is_outdoor));
    setConfirmDelete(null);
  }

  // ── Vue liste ─────────────────────────────────
  if (!editing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mes spots</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {spots.length === 0 && (
            <Text style={{ color: palette.textMuted, textAlign: 'center', padding: spacing.xl }}>
              Aucun spot configuré.
            </Text>
          )}

          {spots.map(s => (
            <View key={s.id} style={styles.spotRow}>
              {/* Logo ou emoji */}
              {s.logo_url
                ? <Image source={{ uri: s.logo_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                : <Text style={{ fontSize: 28 }}>🌿</Text>
              }
              <View style={{ flex: 1 }}>
                <Text style={styles.spotName}>{s.name}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: 4 }}>
                  {(s.types || ['bloc', 'diff']).map(t => (
                    <Text key={t} style={styles.typeChip}>
                      {t === 'bloc' ? '🧱 Bloc' : '🧗 Diff'}
                    </Text>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing({ ...s, logoUrl: s.logo_url })}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirmDelete(s.name)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setEditing({ id: null, name: '', types: ['bloc', 'diff'], logoUrl: null })}
          >
            <Text style={styles.addBtnText}>+ Ajouter un spot</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Confirmation suppression */}
        <Modal visible={!!confirmDelete} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setConfirmDelete(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Supprimer ce spot ?</Text>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.danger, marginBottom: spacing.sm }]} onPress={handleDelete}>
                <Text style={styles.btnText}>Supprimer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmDelete(null)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Vue édition ───────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setEditing(null); setError(''); }}>
          <Text style={styles.back}>← Spots</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editing.id ? 'Modifier' : 'Nouveau spot'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <Text style={styles.label}>Logo <Text style={{ fontWeight: '400', color: palette.textMuted }}>(optionnel)</Text></Text>
        <AvatarUploader
          userId={userId}
          currentUrl={editing?.logoUrl}
          folder="logos"
          size={56}
          placeholder="🌿"
          onUploaded={url => setEditing(e => ({ ...e, logoUrl: url }))}
        />

        {/* Nom */}
        <Text style={styles.label}>Nom du spot</Text>
        <TextInput
          style={styles.input}
          value={editing.name}
          onChangeText={v => { setEditing(e => ({ ...e, name: v })); setError(''); }}
          placeholder="ex. Gorges du Verdon"
          placeholderTextColor={palette.textMuted}
        />

        {/* Type */}
        <Text style={styles.label}>Type de grimpe</Text>
        <View style={styles.pillGroup}>
          {['bloc', 'diff'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, (editing.types || []).includes(t) && styles.pillActive]}
              onPress={() => {
                const types = editing.types || ['bloc', 'diff'];
                const next  = types.includes(t) ? types.filter(x => x !== t) : [...types, t];
                if (next.length === 0) return;
                setEditing(e => ({ ...e, types: next }));
              }}
            >
              <Text style={[styles.pillText, (editing.types || []).includes(t) && styles.pillTextActive]}>
                {t === 'bloc' ? '🧱 Bloc' : '🧗 Diff'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editing.id ? 'Enregistrer' : 'Créer le spot'}</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: {
      flex:            1,
      backgroundColor: palette.bg,
    },
    header: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical:   spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      backgroundColor:   palette.bgCard,
    },
    back: {
      fontSize:   typography.base,
      color:      colors.accent,
      fontWeight: typography.semibold,
    },
    title: {
      fontSize:   typography.lg,
      fontWeight: typography.black,
      color:      palette.textPrimary,
    },
    content: {
      padding: spacing.lg,
    },
    spotRow: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             spacing.sm,
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.md,
      marginBottom:    spacing.sm,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    spotName: {
      fontSize:   typography.base,
      fontWeight: typography.bold,
      color:      palette.textPrimary,
    },
    typeChip: {
      fontSize:   typography.xs,
      color:      palette.textMuted,
      fontWeight: typography.semibold,
    },
    editBtn: {
      padding: spacing.sm,
    },
    deleteBtn: {
      padding: spacing.sm,
    },
    addBtn: {
      backgroundColor: colors.accent,
      borderRadius:    radius.md,
      padding:         spacing.md,
      alignItems:      'center',
      marginTop:       spacing.sm,
    },
    addBtnText: {
      color:      '#fff',
      fontSize:   typography.base,
      fontWeight: typography.bold,
    },
    label: {
      fontSize:     typography.sm,
      fontWeight:   typography.semibold,
      color:        palette.textSecondary,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: palette.bgInput,
      borderWidth:     1.5,
      borderColor:     palette.border,
      borderRadius:    radius.md,
      padding:         spacing.md,
      fontSize:        typography.base,
      color:           palette.textPrimary,
      marginBottom:    spacing.md,
    },
    pillGroup: {
      flexDirection: 'row',
      gap:           spacing.sm,
      marginBottom:  spacing.md,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical:   spacing.xs,
      borderRadius:      radius.full,
      borderWidth:       1.5,
      borderColor:       palette.border,
      backgroundColor:   palette.bgInput,
    },
    pillActive: {
      backgroundColor: colors.accent,
      borderColor:     colors.accent,
    },
    pillText: {
      fontSize:   typography.sm,
      fontWeight: typography.semibold,
      color:      palette.textSecondary,
    },
    pillTextActive: {
      color: '#fff',
    },
    btn: {
      backgroundColor: colors.accent,
      borderRadius:    radius.md,
      padding:         spacing.md,
      alignItems:      'center',
      marginBottom:    spacing.sm,
    },
    btnDisabled: {
      backgroundColor: palette.textMuted,
    },
    btnText: {
      color:      '#fff',
      fontSize:   typography.base,
      fontWeight: typography.bold,
    },
    error: {
      fontSize:        typography.sm,
      color:           colors.danger,
      backgroundColor: '#FEE2E2',
      borderRadius:    radius.md,
      padding:         spacing.md,
      marginBottom:    spacing.md,
    },
    sheet: {
      backgroundColor:      palette.bgCard,
      borderTopLeftRadius:  20,
      borderTopRightRadius: 20,
      padding:              spacing.xl,
      paddingBottom:        spacing.xxl,
    },
    sheetHandle: {
      width:           40,
      height:          4,
      backgroundColor: palette.border,
      borderRadius:    2,
      alignSelf:       'center',
      marginBottom:    spacing.lg,
    },
    sheetTitle: {
      fontSize:     typography.lg,
      fontWeight:   typography.bold,
      color:        palette.textPrimary,
      marginBottom: spacing.lg,
    },
    cancelBtn: {
      padding:         spacing.md,
      backgroundColor: palette.bgInput,
      borderRadius:    radius.md,
      alignItems:      'center',
    },
    cancelText: {
      fontSize:   typography.base,
      fontWeight: typography.semibold,
      color:      palette.textSecondary,
    },
  });
}