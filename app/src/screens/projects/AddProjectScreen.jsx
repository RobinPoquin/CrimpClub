import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { addProject, updateProject } from '../../../lib/projects';
import { getGyms } from '../../../lib/gyms';
import { getLocations } from '../../../lib/locations';

const GRADES_FRENCH = [
  "3","3+","4","4+","5a","5b","5c",
  "6a","6a+","6b","6b+","6c","6c+",
  "7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+",
  "9a","9a+","9b","9b+","9c",
];

const GRADES_BLOC = [
  "3","4","5","5+","6A","6A+","6B","6B+","6C","6C+",
  "7A","7A+","7B","7B+","7C","7C+",
  "8A","8A+","8B","8B+","8C","8C+",
];

const TYPES = ["Bloc","Diff","Trad","Grande voie","Deep water solo"];
const today = new Date().toISOString().split("T")[0];

// Formulaire vide par défaut
const EMPTY_FORM = {
  type:          "Diff",
  outdoor:       false,
  grade:         "6a",
  location:      "",
  sector:        "",
  routeName:     "",
  objectiveDate: null,
  gymId:         null,
  colorId:       null,
  colorHex:      null,
  colorName:     null,
  gradeHint:     null,
};

export default function AddProjectScreen({ navigation, route }) {
  const userId      = route?.params?.userId;
  const editProject = route?.params?.project;
  const isEdit      = !!editProject;

  const { palette, theme } = useTheme();
  const styles = makeStyles(palette);

  // Initialise le formulaire selon le mode ajout ou édition
  const [form, setForm]               = useState(isEdit ? {
    type:          editProject.type          || "Diff",
    outdoor:       editProject.outdoor       || false,
    grade:         editProject.grade         || "6a",
    location:      editProject.location      || "",
    sector:        editProject.sector        || "",
    routeName:     editProject.routeName     || "",
    objectiveDate: editProject.objectiveDate || null,
    gymId:         editProject.gymId         || null,
    colorId:       editProject.colorId       || null,
    colorHex:      editProject.colorHex      || null,
    colorName:     editProject.colorName     || null,
    gradeHint:     editProject.gradeHint     || null,
  } : EMPTY_FORM);

  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [gyms, setGyms]                 = useState([]);
  const [locations, setLocations]       = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [blocMode, setBlocMode]         = useState(editProject?.colorId ? 'color' : 'grade');
  const [lastGymId, setLastGymId]       = useState(editProject?.gymId || null);

  const isBloc    = form.type === 'Bloc';
  const colorMode = isBloc && !form.outdoor && blocMode === 'color';
  const grades    = isBloc ? GRADES_BLOC : GRADES_FRENCH;

  // Charge les salles et lieux au montage
  useEffect(() => {
    async function load() {
      if (!userId) return;
      const [g, l] = await Promise.all([getGyms(userId), getLocations(userId)]);
      setGyms(g);
      setLocations(l);
    }
    load();
  }, [userId]);

  // Suggestions de lieux filtrées selon le type et la saisie
  const suggestions = [
    ...(!form.outdoor ? gyms
      .filter(g => (g.types || []).includes(form.type.toLowerCase()))
      .map(g => ({ name: g.name, icon: '🏟️' })) : []),
    ...(form.outdoor
      ? locations.filter(l => l.is_outdoor).map(l => ({ name: l.name, icon: '🌿' }))
      : []),
  ].filter(s => s.name.toLowerCase().includes(form.location.toLowerCase()));

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      // Types toujours extérieurs
      if (field === "type") {
        if (["Trad", "Grande voie", "Deep water solo"].includes(value)) next.outdoor = true;
        if (["Bloc", "Diff"].includes(value)) next.outdoor = false;
        // Reset cotation et salle au changement de type
        next.colorId = null; next.colorHex = null;
        next.colorName = null; next.gymId = null;
        next.gradeHint = null; next.location = "";
        const wasBloc = f.type === "Bloc";
        const nowBloc = value === "Bloc";
        if (wasBloc !== nowBloc) next.grade = nowBloc ? "6A" : "6a";
      }
      return next;
    });
    setError("");
  }

  async function handleSave() {
    if (!form.location.trim()) { setError("Indique la salle ou le site."); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateProject(editProject.id, form);
      } else {
        await addProject(userId, form);
      }
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
          <Text style={styles.cancelBtn}>← Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? "Modifier le projet" : "Nouveau projet"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

        {/* Type de grimpe */}
        <Text style={styles.label}>Type de grimpe</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md, height: 50 }}>
          <View style={styles.pillGroup}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, form.type === t && styles.pillActive]}
                onPress={() => set("type", t)}
              >
                <Text style={[styles.pillText, form.type === t && styles.pillTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Toggle extérieur */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>En extérieur</Text>
            <Text style={styles.toggleSub}>{form.outdoor ? "Falaise / montagne" : "Salle d'escalade"}</Text>
          </View>
          <Switch
            value={form.outdoor}
            onValueChange={v => set("outdoor", v)}
            trackColor={{ true: colors.accent }}
            thumbColor="#fff"
          />
        </View>

        {/* Sélecteur mode cotation pour blocs intérieurs */}
        {isBloc && !form.outdoor && (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.label}>Système de cotation</Text>
            <View style={styles.pillGroup}>
              <TouchableOpacity
                style={[styles.pill, blocMode === 'color' && styles.pillActive]}
                onPress={() => {
                  setBlocMode('color');
                  if (lastGymId) {
                    set('gymId', lastGymId);
                    const gym = gyms.find(g => g.id === lastGymId);
                    if (gym) set('location', gym.name);
                  }
                }}
              >
                <Text style={[styles.pillText, blocMode === 'color' && styles.pillTextActive]}>🎨 Couleurs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, blocMode === 'grade' && styles.pillActive]}
                onPress={() => {
                  setBlocMode('grade');
                  set('colorId', null); set('colorHex', null);
                  set('colorName', null); set('gymId', null); set('gradeHint', null);
                }}
              >
                <Text style={[styles.pillText, blocMode === 'grade' && styles.pillTextActive]}>🔢 Cotation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cotation officielle */}
        {!colorMode && (
          <>
            <Text style={styles.label}>Cotation</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md, height: 50 }}>
              <View style={styles.pillGroup}>
                {grades.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.pill, form.grade === g && styles.pillActive]}
                    onPress={() => set('grade', g)}
                  >
                    <Text style={[styles.pillText, form.grade === g && styles.pillTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Lieu avec autocomplétion */}
        <Text style={styles.label}>{form.outdoor ? "Site extérieur" : "Salle"}</Text>
        <View style={{ position: 'relative', zIndex: 10 }}>
          <TextInput
            style={styles.input}
            placeholder={form.outdoor ? "ex. Gorges du Verdon" : "ex. Arkose Nation"}
            placeholderTextColor={palette.textMuted}
            value={form.location}
            onChangeText={v => { set("location", v); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={{
              position: 'absolute', top: 48, left: 0, right: 0,
              backgroundColor: palette.bgCard, borderWidth: 1.5,
              borderColor: colors.accent, borderRadius: radius.md,
              zIndex: 20, overflow: 'hidden',
            }}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                    padding: spacing.md,
                    borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                    borderBottomColor: palette.border,
                  }}
                  onPress={() => {
                    set("location", s.name);
                    const gym = gyms.find(g => g.name === s.name);
                    if (gym) { set("gymId", gym.id); setLastGymId(gym.id); }
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                  <Text style={{ fontSize: typography.base, color: palette.textPrimary }}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Sélecteur de couleurs */}
        {colorMode && form.gymId && (() => {
          const gym = gyms.find(g => g.id === form.gymId);
          if (!gym?.colors?.length) return null;
          return (
            <>
              <Text style={styles.label}>Couleur du bloc</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
                {gym.colors.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      set('colorId', c.id); set('colorHex', c.hex);
                      set('colorName', c.name); set('gradeHint', c.gradeHint || null);
                      set('grade', c.gradeHint || form.grade);
                    }}
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: c.hex,
                      borderWidth: form.colorId === c.id ? 3 : 0,
                      borderColor: '#fff',
                      alignItems: 'center', justifyContent: 'center',
                      elevation: 4,
                    }}
                  >
                    {form.colorId === c.id && (
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {form.colorId && (() => {
                const sel = gym.colors.find(c => c.id === form.colorId);
                return sel ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: sel.hex }} />
                    <Text style={{ color: palette.textPrimary, fontWeight: typography.semibold }}>{sel.name}</Text>
                    {sel.gradeHint && <Text style={{ color: palette.textMuted }}>· ~{sel.gradeHint}</Text>}
                  </View>
                ) : null;
              })()}
            </>
          );
        })()}

        {/* Secteur — extérieur uniquement */}
        {form.outdoor && (
          <>
            <Text style={styles.label}>Secteur <Text style={styles.optional}>(optionnel)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="ex. Escalès"
              placeholderTextColor={palette.textMuted}
              value={form.sector}
              onChangeText={v => set("sector", v)}
            />
          </>
        )}

        {/* Nom de la voie */}
        <Text style={styles.label}>Nom de la voie <Text style={styles.optional}>(optionnel)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="ex. La Directe"
          placeholderTextColor={palette.textMuted}
          value={form.routeName}
          onChangeText={v => set("routeName", v)}
        />

        {/* Date objectif */}
        <Text style={styles.label}>Date objectif <Text style={styles.optional}>(optionnel)</Text></Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: form.objectiveDate ? palette.textPrimary : palette.textMuted, fontSize: typography.base }}>
            {form.objectiveDate
              ? new Date(form.objectiveDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : "Choisir une date"}
          </Text>
        </TouchableOpacity>

        {/* Date picker natif */}
        {showDatePicker && (
          <DateTimePicker
            value={form.objectiveDate ? new Date(form.objectiveDate) : new Date()}
            mode="date"
            display="inline"
            locale="fr-FR"
            minimumDate={new Date()}
            themeVariant={theme === 'dark' ? 'dark' : 'light'}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) set("objectiveDate", date.toISOString().split("T")[0]);
            }}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le projet"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
      borderBottomWidth: 1, borderBottomColor: palette.border,
      backgroundColor: palette.bgCard,
    },
    cancelBtn: { fontSize: typography.base, color: colors.accent, fontWeight: typography.semibold },
    title: { fontSize: typography.lg, fontWeight: typography.black, color: palette.textPrimary },
    form: { padding: spacing.xl },
    label: { fontSize: typography.sm, fontWeight: typography.semibold, color: palette.textSecondary, marginBottom: spacing.xs },
    optional: { fontWeight: typography.regular, color: palette.textMuted },
    input: {
      backgroundColor: palette.bgInput, borderWidth: 1.5, borderColor: palette.border,
      borderRadius: radius.md, padding: spacing.md, fontSize: typography.base,
      color: palette.textPrimary, marginBottom: spacing.md,
    },
    pillGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    pill: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
      borderRadius: radius.full, borderWidth: 1.5,
      borderColor: palette.border, backgroundColor: palette.bgInput,
    },
    pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    pillText: { fontSize: typography.sm, fontWeight: typography.semibold, color: palette.textSecondary },
    pillTextActive: { color: '#fff' },
    toggleRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: spacing.md, paddingVertical: spacing.xs,
    },
    toggleLabel: { fontSize: typography.base, fontWeight: typography.semibold, color: palette.textPrimary },
    toggleSub: { fontSize: typography.xs, color: palette.textMuted, marginTop: 2 },
    error: {
      fontSize: typography.sm, color: colors.danger, backgroundColor: '#FEE2E2',
      borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
    },
    saveBtn: {
      backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
      alignItems: 'center', elevation: 4, marginTop: spacing.md,
    },
    saveBtnDisabled: { backgroundColor: palette.textMuted, elevation: 0 },
    saveBtnText: { color: '#fff', fontSize: typography.base, fontWeight: typography.bold },
  });
}