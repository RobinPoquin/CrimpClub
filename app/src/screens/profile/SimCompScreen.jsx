import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, Modal, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  canAccessSimcomp, calculateBlocScore, calculateTotalScore,
  createEmptyBloc, getSimcomps, addSimcomp, updateSimcomp, deleteSimcomp,
} from '../../../lib/simcomp';
import MediaUploader from '../../components/ascent/MediaUploader';
import Lightbox from '../../components/common/Lightbox';

export default function SimCompScreen({ navigation, route }) {
  const userId = route?.params?.userId;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [simcomps, setSimcomps]       = useState([]);
  const [editing, setEditing]         = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  // Vérifie l'accès
  if (!canAccessSimcomp(userId)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>SimComp</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48 }}>🔒</Text>
          <Text style={{ color: palette.textMuted, marginTop: spacing.md }}>Accès restreint</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Charge les simulations au focus
  useFocusEffect(
    useCallback(() => {
      getSimcomps(userId).then(setSimcomps);
    }, [userId])
  );

  // Met à jour un champ d'un bloc
  function updateBloc(idx, field, value) {
    setEditing(e => {
      const blocs = [...e.blocs];
      blocs[idx] = { ...blocs[idx], [field]: value };
      return { ...e, blocs, totalScore: calculateTotalScore(blocs) };
    });
  }

  // Change le nombre de blocs
  function handleNbBlocs(nb) {
    setEditing(e => {
      const current = e.blocs;
      const blocs   = nb > current.length
        ? [...current, ...Array.from({ length: nb - current.length }, (_, i) => createEmptyBloc(current.length + i))]
        : current.slice(0, nb);
      return { ...e, nbBlocs: nb, blocs, totalScore: calculateTotalScore(blocs) };
    });
  }

  async function handleSave() {
    setError('');
    if (!editing.name.trim()) { setError('Donne un nom à la simulation.'); return; }
    const blocInvalide = editing.blocs.find(b => b.topEssais !== null && b.zoneEssais === null);
    if (blocInvalide) { setError(`Bloc ${blocInvalide.id} : renseigne la zone si tu as fait le top.`); return; }
    setSaving(true);
    try {
      const totalScore = calculateTotalScore(editing.blocs);
      if (editing.id) {
        await updateSimcomp(editing.id, { name: editing.name, blocs: editing.blocs, totalScore });
      } else {
        await addSimcomp(userId, { name: editing.name, nbBlocs: editing.nbBlocs, blocs: editing.blocs, totalScore });
      }
      setSimcomps(await getSimcomps(userId));
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteSimcomp(confirmDelete);
    setSimcomps(await getSimcomps(userId));
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
          <Text style={styles.title}>🏆 SimComp</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setEditing({ id: null, name: '', nbBlocs: 5, blocs: Array.from({ length: 5 }, (_, i) => createEmptyBloc(i)), totalScore: 0 })}
          >
            <Text style={styles.addBtnText}>+ Nouvelle simulation</Text>
          </TouchableOpacity>

          {simcomps.map(sim => (
            <View key={sim.id} style={styles.simRow}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditing({ id: sim.id, name: sim.name, nbBlocs: sim.nb_blocs, blocs: sim.blocs, totalScore: sim.total_score })}>
                <Text style={styles.simName}>{sim.name}</Text>
                <Text style={styles.simMeta}>🧱 {sim.nb_blocs} blocs · {sim.total_score} pts</Text>
                <Text style={styles.simMeta}>🗓 {new Date(sim.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmDelete(sim.id)} style={{ padding: spacing.sm }}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Confirmation suppression */}
        <Modal visible={!!confirmDelete} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setConfirmDelete(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Supprimer cette simulation ?</Text>
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
  const totalScore = calculateTotalScore(editing.blocs);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setEditing(null); setError(''); }}>
          <Text style={styles.back}>← Simulations</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editing.id ? 'Modifier' : 'Nouvelle simulation'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Nom */}
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          value={editing.name}
          onChangeText={v => setEditing(e => ({ ...e, name: v }))}
          placeholder="ex. Coupe de France 2026"
          placeholderTextColor={palette.textMuted}
        />

        {/* Score total */}
        <View style={styles.scoreTotal}>
          <Text style={styles.scoreTotalLabel}>Score total</Text>
          <Text style={styles.scoreTotalValue}>{totalScore} pts</Text>
        </View>

        {/* Nombre de blocs */}
        <Text style={styles.label}>Nombre de blocs</Text>
        <View style={styles.pillGroup}>
          {[3, 4, 5, 6].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.pill, editing.nbBlocs === n && styles.pillActive]}
              onPress={() => handleNbBlocs(n)}
            >
              <Text style={[styles.pillText, editing.nbBlocs === n && styles.pillTextActive]}>{n} blocs</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Blocs */}
        {editing.blocs.map((bloc, idx) => {
          const blocScore = calculateBlocScore(bloc);
          return (
            <View key={bloc.id} style={styles.blocCard}>
              {/* Header du bloc */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={styles.blocTitle}>Bloc {idx + 1}</Text>
                <Text style={styles.blocScore}>{blocScore > 0 ? `${blocScore} pts` : '0 pt'}</Text>
              </View>

              {/* Zone */}
              <Text style={styles.label}>Zone — essais</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                <View style={styles.pillGroup}>
                  <TouchableOpacity
                    style={[styles.pill, bloc.zoneEssais === null && styles.pillMuted]}
                    onPress={() => updateBloc(idx, 'zoneEssais', null)}
                  >
                    <Text style={[styles.pillText, bloc.zoneEssais === null && styles.pillTextMuted]}>✗</Text>
                  </TouchableOpacity>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.pill, bloc.zoneEssais === n && styles.pillActive]}
                      onPress={() => updateBloc(idx, 'zoneEssais', n)}
                    >
                      <Text style={[styles.pillText, bloc.zoneEssais === n && styles.pillTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Top */}
              <Text style={styles.label}>Top — essais</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                <View style={styles.pillGroup}>
                  <TouchableOpacity
                    style={[styles.pill, bloc.topEssais === null && styles.pillMuted]}
                    onPress={() => updateBloc(idx, 'topEssais', null)}
                  >
                    <Text style={[styles.pillText, bloc.topEssais === null && styles.pillTextMuted]}>✗</Text>
                  </TouchableOpacity>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.pill, bloc.topEssais === n && styles.pillActive]}
                      onPress={() => updateBloc(idx, 'topEssais', n)}
                    >
                      <Text style={[styles.pillText, bloc.topEssais === n && styles.pillTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Commentaire */}
              <Text style={styles.label}>Commentaire <Text style={{ fontWeight: '400', color: palette.textMuted }}>(optionnel)</Text></Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top', marginBottom: spacing.sm }]}
                value={bloc.comment || ''}
                onChangeText={v => updateBloc(idx, 'comment', v)}
                placeholder="Observations, beta..."
                placeholderTextColor={palette.textMuted}
                multiline
              />

              {/* Médias */}
              <Text style={styles.label}>Photo / vidéo <Text style={{ fontWeight: '400', color: palette.textMuted }}>(optionnel)</Text></Text>
              <MediaUploader
                userId={userId}
                mediaList={bloc.mediaList || []}
                onChange={list => updateBloc(idx, 'mediaList', list)}
                onMediaPress={media => setLightbox(media)}
              />
            </View>
          );
        })}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.btn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{editing.id ? 'Enregistrer' : 'Créer la simulation'}</Text>}
        </TouchableOpacity>

      </ScrollView>

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
        
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
      gap:     spacing.md,
    },
    addBtn: {
      backgroundColor: colors.accent,
      borderRadius:    radius.md,
      padding:         spacing.md,
      alignItems:      'center',
    },
    addBtnText: {
      color:      '#fff',
      fontSize:   typography.base,
      fontWeight: typography.bold,
    },
    simRow: {
      flexDirection:   'row',
      alignItems:      'center',
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.md,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    simName: {
      fontSize:   typography.base,
      fontWeight: typography.bold,
      color:      palette.textPrimary,
    },
    simMeta: {
      fontSize:  typography.xs,
      color:     palette.textMuted,
      marginTop: 2,
    },
    scoreTotal: {
      flexDirection:   'row',
      justifyContent:  'space-between',
      alignItems:      'center',
      backgroundColor: palette.bgCard,
      borderRadius:    radius.md,
      padding:         spacing.md,
    },
    scoreTotalLabel: {
      fontSize:   typography.sm,
      fontWeight: typography.semibold,
      color:      palette.textSecondary,
    },
    scoreTotalValue: {
      fontSize:      typography.xxl,
      fontWeight:    typography.black,
      color:         colors.accent,
      letterSpacing: -1,
    },
    blocCard: {
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.md,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    blocTitle: {
      fontSize:   typography.base,
      fontWeight: typography.bold,
      color:      palette.textPrimary,
    },
    blocScore: {
      fontSize:   typography.lg,
      fontWeight: typography.black,
      color:      colors.accent,
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
      gap:           spacing.xs,
      flexWrap:      'wrap',
      marginBottom:  spacing.sm,
    },
    pill: {
      paddingHorizontal: spacing.sm,
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
    pillMuted: {
      backgroundColor: palette.textMuted,
      borderColor:     palette.textMuted,
    },
    pillText: {
      fontSize:   typography.sm,
      fontWeight: typography.semibold,
      color:      palette.textSecondary,
    },
    pillTextActive: {
      color: '#fff',
    },
    pillTextMuted: {
      color: '#fff',
    },
    btn: {
      backgroundColor: colors.accent,
      borderRadius:    radius.md,
      padding:         spacing.md,
      alignItems:      'center',
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