import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  addAttempt, deleteAttempt,
  updateProjectStatus, deleteProject, getProjects
} from '../../../lib/projects';
import { addAscent } from '../../../lib/db';
import MediaUploader from '../../components/ascent/MediaUploader';
import { useFocusEffect } from '@react-navigation/native';

const today = new Date().toISOString().split("T")[0];

export default function ProjectDetailScreen({ navigation, route }) {
  const { project: initialProject, userId } = route.params;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  // On garde une copie locale du projet pour les mises à jour
  const [project, setProject]           = useState(initialProject);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // 'reussi' | 'abandonne' | 'delete'
  const [showAddAttempt, setShowAddAttempt] = useState(false);
  const [attemptForm, setAttemptForm]   = useState({
    date:      today,
    comment:   "",
    mediaList: [],
  });

  const hasColor = project.colorHex && !project.outdoor;

  // Recharge le projet quand on revient dessus
  useFocusEffect(
    useCallback(() => {
      async function reload() {
        const projects = await getProjects(userId);
        const updated = projects.find(p => p.id === initialProject.id);
        if (updated) setProject(updated);
      }
      reload();
    }, [userId, initialProject.id])
  );

  // Ajoute une tentative au projet
  async function handleAddAttempt() {
    setSaving(true);
    try {
      await addAttempt(userId, project.id, attemptForm);
      // Reset le formulaire de tentative
      setAttemptForm({ date: today, comment: "", mediaList: [] });
      setShowAddAttempt(false);
      navigation.goBack(); // refresh via le logbook
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Marque le projet comme réussi et crée une ascension
  async function handleSuccess() {
    setSaving(true);
    try {
      // Crée l'ascension correspondante dans le logbook
      const ascent = await addAscent(userId, {
        routeName:  project.routeName,
        grade:      project.grade,
        type:       project.type,
        outdoor:    project.outdoor,
        location:   project.location,
        sector:     project.sector,
        colorId:    project.colorId,
        colorHex:   project.colorHex,
        colorName:  project.colorName,
        gradeHint:  project.gradeHint,
        gymId:      project.gymId,
        date:       today,
        result:     "Flash",
        comment:    "",
        mediaList:  [],
        tags:       [],
        ropeStyle:  null,
      });
      // Met à jour le statut du projet
      await updateProjectStatus(project.id, "reussi", ascent.id);
      setConfirmAction(null);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Abandonne le projet
  async function handleAbandon() {
    setSaving(true);
    try {
      await updateProjectStatus(project.id, "abandonne");
      setConfirmAction(null);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Supprime le projet
  async function handleDelete() {
    setSaving(true);
    try {
      await deleteProject(project.id);
      setConfirmAction(null);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Projets</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {/* Bouton modifier — uniquement si en cours */}
          {project.status === 'en_cours' && (
            <TouchableOpacity onPress={() => navigation.navigate('AddProject', { userId, project })}>
              <Text style={{ fontSize: 18 }}>✏️</Text>
            </TouchableOpacity>
          )}
          {/* Menu actions */}
          <TouchableOpacity onPress={() => setConfirmAction('menu')}>
            <Text style={{ fontSize: 20, color: palette.textMuted }}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Infos du projet */}
        <View style={{ marginBottom: spacing.lg }}>
          {/* Cotation ou couleur */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
            {hasColor ? (
              <>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: project.colorHex }} />
                <View>
                  <Text style={styles.grade}>{project.colorName}</Text>
                  {project.gradeHint && <Text style={{ color: palette.textMuted, fontSize: typography.sm }}>~{project.gradeHint}</Text>}
                </View>
              </>
            ) : (
              <Text style={styles.grade}>{project.grade || '?'}</Text>
            )}
            {project.routeName && (
              <Text style={{ fontSize: typography.lg, color: palette.textSecondary, fontWeight: typography.semibold }}>
                {project.routeName}
              </Text>
            )}
          </View>

          {/* Meta infos */}
          <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.sm }}>
            <Text style={styles.meta}>{project.type}</Text>
            {project.location && <Text style={styles.meta}>📍 {project.location}</Text>}
            {project.sector && <Text style={styles.meta}>📌 {project.sector}</Text>}
            {project.outdoor && <Text style={styles.meta}>🌿 Extérieur</Text>}
          </View>

          {/* Date objectif */}
          {project.objectiveDate && project.status === 'en_cours' && (() => {
            const days = Math.ceil((new Date(project.objectiveDate) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <Text style={{ fontSize: typography.sm, color: days < 7 ? colors.danger : palette.textMuted }}>
                🎯 Objectif : {new Date(project.objectiveDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}({days > 0 ? `dans ${days} jour${days > 1 ? 's' : ''}` : 'dépassé'})
              </Text>
            );
          })()}
        </View>

        {/* Boutons actions — uniquement si en cours */}
        {project.status === 'en_cours' && (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: palette.bgCard, borderWidth: 1, borderColor: palette.border }]}
              onPress={() => setShowAddAttempt(true)}
            >
              <Text style={{ color: palette.textPrimary, fontWeight: typography.bold }}>+ Tentative</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: colors.accent }]}
              onPress={() => setConfirmAction('reussi')}
            >
              <Text style={{ color: '#fff', fontWeight: typography.bold }}>✓ Réussi !</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Formulaire ajout tentative */}
        {showAddAttempt && (
          <View style={styles.attemptForm}>
            <Text style={styles.sectionTitle}>Nouvelle tentative</Text>

            <Text style={styles.label}>Commentaire <Text style={styles.optional}>(optionnel)</Text></Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Observations, passages clés, beta…"
              placeholderTextColor={palette.textMuted}
              value={attemptForm.comment}
              onChangeText={v => setAttemptForm(f => ({ ...f, comment: v }))}
              multiline
            />

            <Text style={styles.label}>Photo / vidéo <Text style={styles.optional}>(optionnel)</Text></Text>
            <MediaUploader
              userId={userId}
              mediaList={attemptForm.mediaList}
              onChange={list => setAttemptForm(f => ({ ...f, mediaList: list }))}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: palette.bgInput }]}
                onPress={() => setShowAddAttempt(false)}
              >
                <Text style={{ color: palette.textSecondary, fontWeight: typography.bold }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, backgroundColor: colors.accent }]}
                onPress={handleAddAttempt}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: typography.bold }}>Ajouter</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Liste des tentatives */}
        <Text style={styles.sectionTitle}>
          {project.attempts?.length || 0} tentative{project.attempts?.length !== 1 ? 's' : ''}
        </Text>

        {project.attempts?.length === 0 ? (
          <Text style={{ color: palette.textMuted, fontSize: typography.sm, textAlign: 'center', padding: spacing.xl }}>
            Aucune tentative enregistrée.
          </Text>
        ) : (
          project.attempts.map((attempt, idx) => (
            <View key={attempt.id} style={styles.attemptCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <Text style={{ fontSize: typography.sm, fontWeight: typography.semibold, color: palette.textSecondary }}>
                  Tentative {project.attempts.length - idx}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ fontSize: typography.xs, color: palette.textMuted }}>
                    {new Date(attempt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  {/* Bouton suppression tentative */}
                  <TouchableOpacity
                    onPress={async () => {
                      await deleteAttempt(attempt.id);
                      navigation.goBack();
                    }}
                  >
                    <Text style={{ color: colors.danger, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {attempt.comment && (
                <Text style={{ fontSize: typography.sm, color: palette.textSecondary, fontStyle: 'italic' }}>
                  "{attempt.comment}"
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom sheet menu */}
      {confirmAction === 'menu' && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setConfirmAction(null)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setConfirmAction(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              {project.status === 'en_cours' && (
                <TouchableOpacity style={styles.sheetAction} onPress={() => setConfirmAction('abandonne')}>
                  <Text style={styles.sheetActionIcon}>🚫</Text>
                  <Text style={styles.sheetActionText}>Abandonner</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.sheetAction} onPress={() => setConfirmAction('delete')}>
                <Text style={styles.sheetActionIcon}>🗑️</Text>
                <Text style={[styles.sheetActionText, { color: colors.danger }]}>Supprimer le projet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setConfirmAction(null)}>
                <Text style={styles.sheetCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation réussi */}
      {confirmAction === 'reussi' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmAction(null)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setConfirmAction(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={{ fontSize: typography.lg, fontWeight: typography.bold, color: palette.textPrimary, marginBottom: spacing.sm }}>🎉 Projet réussi !</Text>
              <Text style={{ fontSize: typography.sm, color: palette.textSecondary, marginBottom: spacing.lg }}>
                Une ascension sera automatiquement ajoutée à ton logbook.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent, marginBottom: spacing.sm }]}
                onPress={handleSuccess}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: typography.bold }}>Confirmer la réussite</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setConfirmAction(null)}>
                <Text style={styles.sheetCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation abandon */}
      {confirmAction === 'abandonne' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmAction(null)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setConfirmAction(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={{ fontSize: typography.lg, fontWeight: typography.bold, color: palette.textPrimary, marginBottom: spacing.sm }}>Abandonner ce projet ?</Text>
              <Text style={{ fontSize: typography.sm, color: palette.textSecondary, marginBottom: spacing.lg }}>
                Tes tentatives seront conservées.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: palette.textMuted, marginBottom: spacing.sm }]}
                onPress={handleAbandon}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: typography.bold }}>Abandonner</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setConfirmAction(null)}>
                <Text style={styles.sheetCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation suppression */}
      {confirmAction === 'delete' && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setConfirmAction(null)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setConfirmAction(null)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={{ fontSize: typography.lg, fontWeight: typography.bold, color: palette.textPrimary, marginBottom: spacing.sm }}>Supprimer ce projet ?</Text>
              <Text style={{ fontSize: typography.sm, color: palette.textSecondary, marginBottom: spacing.lg }}>
                Le projet et toutes ses tentatives seront définitivement supprimés.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.danger, marginBottom: spacing.sm }]}
                onPress={handleDelete}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: typography.bold }}>Supprimer</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setConfirmAction(null)}>
                <Text style={styles.sheetCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: palette.bg },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
      borderBottomWidth: 1, borderBottomColor: palette.border,
      backgroundColor: palette.bgCard,
    },
    backBtn:      { fontSize: typography.base, color: colors.accent, fontWeight: typography.semibold },
    content:      { padding: spacing.xl },
    grade: {
      fontSize: typography.xxl, fontWeight: typography.black,
      letterSpacing: -1, color: palette.textPrimary,
    },
    meta:         { fontSize: typography.xs, color: palette.textMuted },
    sectionTitle: {
      fontSize: typography.sm, fontWeight: typography.bold,
      color: palette.textMuted, textTransform: 'uppercase',
      letterSpacing: 0.5, marginBottom: spacing.md,
    },
    actionBtn: {
      padding: spacing.md, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
    },
    attemptForm: {
      backgroundColor: palette.bgCard, borderRadius: radius.lg,
      padding: spacing.lg, marginBottom: spacing.lg,
      borderWidth: 1, borderColor: palette.border,
    },
    attemptCard: {
      backgroundColor: palette.bgCard, borderRadius: radius.md,
      padding: spacing.md, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: palette.border,
    },
    label:        { fontSize: typography.sm, fontWeight: typography.semibold, color: palette.textSecondary, marginBottom: spacing.xs },
    optional:     { fontWeight: '400', color: palette.textMuted },
    input: {
      backgroundColor: palette.bgInput, borderWidth: 1.5, borderColor: palette.border,
      borderRadius: radius.md, padding: spacing.md, fontSize: typography.base,
      color: palette.textPrimary, marginBottom: spacing.md,
    },
    error: {
      fontSize: typography.sm, color: colors.danger, backgroundColor: '#FEE2E2',
      borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
    },
    sheet: {
      backgroundColor: palette.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: spacing.xl, paddingBottom: spacing.xxl,
    },
    sheetHandle: {
      width: 40, height: 4, backgroundColor: palette.border,
      borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg,
    },
    sheetAction: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border,
    },
    sheetActionIcon: { fontSize: 20 },
    sheetActionText: { fontSize: typography.base, fontWeight: typography.medium, color: palette.textPrimary },
    sheetCancel: {
      marginTop: spacing.md, padding: spacing.md,
      backgroundColor: palette.bgInput, borderRadius: radius.md, alignItems: 'center',
    },
    sheetCancelText: { fontSize: typography.base, fontWeight: typography.semibold, color: palette.textSecondary },
  });
}