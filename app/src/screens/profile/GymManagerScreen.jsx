import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Switch, ActivityIndicator, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getGyms, addGym, updateGym, deleteGym } from '../../../lib/gyms';
import AvatarUploader from '../../components/common/AvatarUploader';

// Couleurs par défaut pour une nouvelle salle
const DEFAULT_COLORS = [
  { id: 'c1', name: 'Jaune',  hex: '#FACC15', gradeHint: '' },
  { id: 'c2', name: 'Vert',   hex: '#22C55E', gradeHint: '' },
  { id: 'c3', name: 'Bleu',   hex: '#3B82F6', gradeHint: '' },
  { id: 'c4', name: 'Rouge',  hex: '#EF4444', gradeHint: '' },
  { id: 'c5', name: 'Noir',   hex: '#18181B', gradeHint: '' },
];

export default function GymManagerScreen({ navigation, route }) {
  const userId = route?.params?.userId;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [gyms, setGyms]               = useState([]);
  const [editing, setEditing]         = useState(null); // null = liste, objet = édition
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Charge les salles au focus
  useFocusEffect(
    useCallback(() => {
      getGyms(userId).then(setGyms);
    }, [userId])
  );

  // Ajoute une couleur à la salle en cours d'édition
  function addColor() {
    setEditing(e => ({
      ...e,
      colors: [...e.colors, { id: `c_${Date.now()}`, name: '', hex: '#888888', gradeHint: '' }],
    }));
  }

  // Modifie un champ d'une couleur
  function setColor(idx, field, value) {
    setEditing(e => {
      const colors = [...e.colors];
      colors[idx] = { ...colors[idx], [field]: value };
      return { ...e, colors };
    });
  }

  // Supprime une couleur
  function removeColor(idx) {
    setEditing(e => ({ ...e, colors: e.colors.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!editing.name.trim()) { setError('Donne un nom à la salle.'); return; }
    setSaving(true); setError('');
    try {
      if (editing.id) {
        await updateGym(editing.id, { name: editing.name, colors: editing.colors, types: editing.types, logo_url: editing.logoUrl });
      } else {
        await addGym(userId, { name: editing.name, colors: editing.colors, types: editing.types });
      }
      const data = await getGyms(userId);
      setGyms(data);
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteGym(confirmDelete);
    const data = await getGyms(userId);
    setGyms(data);
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
          <Text style={styles.title}>Mes salles</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {gyms.map(g => (
            <View key={g.id} style={styles.gymRow} >
                {/* Logo ou emoji par défaut */}
                {g.logoUrl
                ? <Image source={{ uri: g.logoUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                : <Text style={{ fontSize: 28 }}>🏟️</Text>
                }
                <View style={{ flex: 1 }}>
                <Text style={styles.gymName}>{g.name}</Text>
                {/* Pastilles de couleurs */}
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {g.colors?.map(c => (
                    <View key={c.id} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.hex }} />
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditing({ ...g, colors: g.colors?.map(c => ({ ...c })) || [], types: g.types || ['bloc', 'diff'], logoUrl: g.logoUrl })}
              >
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setConfirmDelete(g.id)}
              >
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setEditing({ id: null, name: '', colors: DEFAULT_COLORS.map(c => ({ ...c })), types: ['bloc', 'diff'] })}
          >
            <Text style={styles.addBtnText}>+ Ajouter une salle</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Confirmation suppression */}
        <Modal visible={!!confirmDelete} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setConfirmDelete(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Supprimer cette salle ?</Text>
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
          <Text style={styles.back}>← Salles</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editing.id ? 'Modifier' : 'Nouvelle salle'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Nom */}
        <Text style={styles.label}>Nom de la salle</Text>
        <TextInput
          style={styles.input}
          value={editing.name}
          onChangeText={v => { setEditing(e => ({ ...e, name: v })); setError(''); }}
          placeholder="ex. La Verticale"
          placeholderTextColor={palette.textMuted}
        />

        {/* Logo */}
        <Text style={styles.label}>Logo <Text style={{ fontWeight: '400', color: palette.textMuted }}>(optionnel)</Text></Text>
        <AvatarUploader
            userId={userId}
            currentUrl={editing?.logoUrl}
            folder="logos"
            size={56}
            placeholder="🏟️"
            onUploaded={url => setEditing(e => ({ ...e, logoUrl: url }))}
        />

        {/* Type */}
        <Text style={styles.label}>Type de salle</Text>
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

        {/* Couleurs — uniquement si bloc */}
        {(editing.types || []).includes('bloc') && (
          <>
            <Text style={styles.label}>Niveaux de couleurs</Text>
            {editing.colors.map((c, idx) => (
              <View key={c.id} style={styles.colorRow}>
                {/* Numéro */}
                <Text style={{ color: palette.textMuted, width: 20 }}>{idx + 1}</Text>

                {/* Sélecteur couleur */}
                <View style={[styles.colorSwatch, { backgroundColor: c.hex }]} />

                {/* Nom */}
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={c.name}
                  onChangeText={v => setColor(idx, 'name', v)}
                  placeholder="Nom"
                  placeholderTextColor={palette.textMuted}
                />

                {/* Cotation indicative */}
                <TextInput
                  style={[styles.input, { width: 60, marginBottom: 0 }]}
                  value={c.gradeHint}
                  onChangeText={v => setColor(idx, 'gradeHint', v)}
                  placeholder="6A"
                  placeholderTextColor={palette.textMuted}
                />

                {/* Supprimer */}
                <TouchableOpacity onPress={() => removeColor(idx)}>
                  <Text style={{ color: colors.danger, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={[styles.btn, { backgroundColor: palette.bgInput, marginBottom: spacing.md }]} onPress={addColor}>
              <Text style={[styles.btnText, { color: palette.textPrimary }]}>+ Ajouter une couleur</Text>
            </TouchableOpacity>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editing.id ? 'Enregistrer' : 'Créer la salle'}</Text>}
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
    gymRow: {
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.md,
      marginBottom:    spacing.sm,
      borderWidth:     1,
      borderColor:     palette.border,
      gap: spacing.sm
    },
    gymName: {
      fontSize:   typography.base,
      fontWeight: typography.bold,
      color:      palette.textPrimary,
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
    colorRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           spacing.sm,
      marginBottom:  spacing.sm,
    },
    colorSwatch: {
      width:        32,
      height:       32,
      borderRadius: 6,
      borderWidth:  1,
      borderColor:  palette.border,
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