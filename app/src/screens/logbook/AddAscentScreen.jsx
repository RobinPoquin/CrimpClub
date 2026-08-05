import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../theme';
import { addAscent, updateAscent } from '../../../lib/db';
import MediaUploader from '../../components/ascent/MediaUploader';
import { uploadMedia } from '../../../lib/storage';
import { getGyms } from '../../../lib/gyms';
import { getLocations } from '../../../lib/locations';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../theme/ThemeContext';

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

const TYPES   = ["Bloc","Diff","Trad","Grande voie","Deep water solo"];
const RESULTS = ["Flash","Travaillé"];
const today   = new Date().toISOString().split("T")[0];

const EMPTY_FORM = {
  type:       "Diff",
  outdoor:    false,
  grade:      "6a",
  location:   "",
  result:     "Flash",
  date:       today,
  routeName:  "",
  ropeStyle:  null,
  sector:     "",
  tags:       [],
  comment:    "",
  mediaList:  [],
  gymId:      null,
  colorId:    null,
  colorHex:   null,
  colorName:  null,
  gradeHint:  null,
};

export default function AddAscentScreen({ navigation, route }) {
  const userId = route?.params?.userId;
  const editAscent  = route?.params?.ascent;
  const isEdit      = !!editAscent;
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  // Salles et lieux pour l'autocomplétion
  const [gyms, setGyms]           = useState([]);
  const [locations, setLocations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [lastGymId, setLastGymId] = useState(editAscent?.gymId || null);

  // Pré-remplit le formulaire si on est en mode édition
  const [form, setForm] = useState(editAscent ? {
    type:      editAscent.type      || "Diff",
    outdoor:   editAscent.outdoor   || false,
    grade:     editAscent.grade     || "6a",
    location:  editAscent.location  || "",
    result:    editAscent.result    || "Flash",
    date:      editAscent.date      || today,
    routeName: editAscent.routeName || "",
    ropeStyle: editAscent.ropeStyle || null,
    sector:    editAscent.sector    || "",
    tags:      editAscent.tags      || [],
    comment:   editAscent.comment   || "",
    mediaList: editAscent.mediaList || [],
    gymId:     editAscent.gymId     || null,
    colorId:   editAscent.colorId   || null,
    colorHex:  editAscent.colorHex  || null,
    colorName: editAscent.colorName || null,
    gradeHint: editAscent.gradeHint || null,
  } : EMPTY_FORM);

  useEffect(() => {
    async function load() {
      const [g, l] = await Promise.all([
        getGyms(userId),
        getLocations(userId),
      ]);
      setGyms(g);
      // Garde toutes les locations sans filtrer
      setLocations(l);
    }
    if (userId) load();
  }, [userId]);

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      // Types toujours extérieurs
      if (field === "type") {
        if (["Trad", "Grande voie", "Deep water solo"].includes(value)) {
          next.outdoor = true;
        }
        if (["Bloc", "Diff"].includes(value)) {
          next.outdoor = false;
        }
        
        // Reset cotation si changement bloc/voie
        const wasBloc = f.type === "Bloc";
        const nowBloc = value === "Bloc";
        if (wasBloc !== nowBloc) next.grade = nowBloc ? "6A" : "6a";
        // Reset tous les champs liés à la salle et couleurs
        next.colorId   = null;
        next.colorHex  = null;
        next.colorName = null;
        next.gymId     = null;
        next.gradeHint = null;
        next.location  = "";
        if (!nowBloc) {
          next.colorId = null; next.colorHex = null;
          next.colorName = null; next.gymId = null;
        }
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
        await updateAscent(editAscent.id, form);
      } else {
        await addAscent(userId, form);
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!form.location.trim()) { setError("Indique la salle ou le site."); return; }
    setSaving(true);
    try {
      const uploadedMedia = await Promise.all(
        form.mediaList.map(async m => {
          if (m.uploaded) return m;
          return await uploadMedia(userId, m);
        })
      );

      await addAscent(userId, { ...form, mediaList: uploadedMedia });
      
      // Appelle le callback pour recharger le logbook
      const onAscentAdded = route?.params?.onAscentAdded;
      if (onAscentAdded) onAscentAdded();
      
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Suggestions filtrées selon la saisie et le type (intérieur/extérieur)
  const suggestions = [
    ...(!form.outdoor ? gyms
      .filter(g => (g.types || []).includes(form.type.toLowerCase()))
      .map(g => ({ name: g.name, icon: '🏟️' })) : []),
    ...(form.outdoor 
      ? locations.filter(l => l.is_outdoor).map(l => ({ name: l.name, icon: '🌿' })) 
      : []),
  ].filter(s => 
    s.name.toLowerCase().includes(form.location.toLowerCase())
  );

  const isBloc     = form.type === "Bloc";
  const grades     = isBloc ? GRADES_BLOC : GRADES_FRENCH;

  const [blocMode, setBlocMode] = useState(
    editAscent?.colorId ? 'color' : 'grade'
  );

  const colorMode = isBloc && !form.outdoor && blocMode === 'color';
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>← Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? "Modifier" : "Nouvelle ascension"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

        {/* Type de grimpe */}
        <Text style={styles.label}>Type de grimpe</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
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

        {/* Choix du système de cotation pour les blocs intérieurs */}
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
                onPress={() => { setBlocMode('grade'); set('colorId', null); set('colorHex', null); set('colorName', null); set('gymId', null); set('gradeHint', null); }}
              >
                <Text style={[styles.pillText, blocMode === 'grade' && styles.pillTextActive]}>🔢 Cotation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Cotation */}
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

        {/* Sélecteur de couleurs — bloc intérieur */}
        {colorMode && (
          <>
            {/* Pastilles de couleur de la salle sélectionnée via l'autocomplétion */}
            {form.gymId && (() => {
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
                          setBlocMode('color');
                          set('colorId', c.id);
                          set('colorHex', c.hex);
                          set('colorName', c.name);
                          set('gradeHint', c.gradeHint || null);
                          set('grade', c.gradeHint || form.grade);

                          // Restaure la dernière salle sélectionnée
                          if (lastGymId) set('gymId', lastGymId);
                        }}
                        style={{
                          width:           44,
                          height:          44,
                          borderRadius:    22,
                          backgroundColor: c.hex,
                          borderWidth:     form.colorId === c.id ? 3 : 0,
                          borderColor:     '#fff',
                          alignItems:      'center',
                          justifyContent:  'center',
                          shadowColor:     '#000',
                          shadowOffset:    { width: 0, height: 2 },
                          shadowOpacity:   0.3,
                          shadowRadius:    4,
                          elevation:       4,
                        }}
                      >
                        {form.colorId === c.id && (
                          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Nom + cotation indicative */}
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
          </>
        )}

        {/* Lieu */}
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
          {/* Liste de suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={{
              position:        'absolute',
              top:             48,
              left:            0,
              right:           0,
              backgroundColor: palette.bgCard,
              borderWidth:     1.5,
              borderColor:     colors.accent,
              borderRadius:    radius.md,
              zIndex:          20,
              overflow:        'hidden',
            }}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection:     'row',
                    alignItems:        'center',
                    gap:               spacing.sm,
                    padding:           spacing.md,
                    borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                    borderBottomColor: palette.border,
                  }}
                  onPress={() => {
                    set("location", s.name);
                    // Si c'est une salle, setter aussi gymId pour afficher les couleurs
                    const gym = gyms.find(g => g.name === s.name);
                    if (gym) {
                      set("gymId", gym.id);
                      setLastGymId(gym.id); 
                    }
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

        {/* Secteur (extérieur uniquement) */}
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

        {/* Résultat */}
        <Text style={styles.label}>Résultat</Text>
        <View style={[styles.pillGroup, { marginBottom: spacing.md }]}>
          {RESULTS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.pill, form.result === r && styles.pillActive]}
              onPress={() => set("result", r)}
            >
              <Text style={[styles.pillText, form.result === r && styles.pillTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: palette.textPrimary, fontSize: typography.base }}>
            {new Date(form.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>

        {/* Date picker natif */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(form.date)}
            mode="date"
            display="inline"
            locale="fr-FR"
            maximumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) set("date", date.toISOString().split("T")[0]);
            }}
          />
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

        {/* Style moulinette/tête (pas pour le bloc) */}
        {!isBloc && (
          <>
            <Text style={styles.label}>Style <Text style={styles.optional}>(optionnel)</Text></Text>
            <View style={[styles.pillGroup, { marginBottom: spacing.md }]}>
              {[{ key: "moulinette", label: "🔄 Moulinette" }, { key: "tete", label: "🧗 En tête" }].map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.pill, form.ropeStyle === s.key && styles.pillActive]}
                  onPress={() => set("ropeStyle", form.ropeStyle === s.key ? null : s.key)}
                >
                  <Text style={[styles.pillText, form.ropeStyle === s.key && styles.pillTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Commentaire */}
        <Text style={styles.label}>Commentaire <Text style={styles.optional}>(optionnel)</Text></Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Ressenti, conditions, clé de pas, beta…"
          placeholderTextColor={palette.textMuted}
          value={form.comment}
          onChangeText={v => set("comment", v)}
          multiline
          numberOfLines={3}
        />

        {/* Tags */}
        <Text style={styles.label}>Tags <Text style={styles.optional}>(optionnel)</Text></Text>
        <View style={styles.tagsWrap}>
          {/* Tags sélectionnés */}
          <View style={styles.selectedTags}>
            {form.tags.map((tag, i) => (
              <TouchableOpacity
                key={i}
                style={styles.tagSelected}
                onPress={() => set("tags", form.tags.filter((_, j) => j !== i))}
              >
                <Text style={styles.tagSelectedText}>{tag} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Suggestions */}
          <View style={styles.tagSuggestions}>
            {["Dalle","Dévers","Dièdre","Fissure","Toit","Dynamique","Force","Technique","Endurance","Mental","Réglettes","Colonnettes","Pinces"]
              .filter(t => !form.tags.includes(t))
              .map(t => (
                <TouchableOpacity
                  key={t}
                  style={styles.tagSuggestion}
                  onPress={() => set("tags", [...form.tags, t])}
                >
                  <Text style={styles.tagSuggestionText}>+ {t}</Text>
                </TouchableOpacity>
              ))
            }
          </View>
        </View>

        {/* Photo / vidéo */}
        <Text style={styles.label}>Photo / vidéo <Text style={styles.optional}>(optionnel)</Text></Text>
        <MediaUploader
          userId={userId}
          mediaList={form.mediaList}
          onChange={list => set("mediaList", list)}
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Enregistrer l'ascension"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.bg,
    },
    header: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical:   spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    cancelBtn: {
      fontSize:  typography.base,
      color:     colors.accent,
      fontWeight: typography.semibold,
    },
    title: {
      fontSize:   typography.lg,
      fontWeight: typography.black,
      color:      palette.textPrimary,
    },
    form: {
      padding: spacing.xl,
    },
    label: {
      fontSize:     typography.sm,
      fontWeight:   typography.semibold,
      color:        palette.textSecondary,
      marginBottom: spacing.xs,
    },
    optional: {
      fontWeight: typography.regular,
      color:      palette.textMuted,
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
    textarea: {
      height:     100,
      textAlignVertical: 'top',
    },
    pillGroup: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           spacing.sm,
      marginBottom:  spacing.md,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical:   spacing.xs + 2,
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
    toggleRow: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      alignItems:     'center',
      marginBottom:   spacing.md,
      paddingVertical: spacing.xs,
    },
    toggleLabel: {
      fontSize:   typography.base,
      fontWeight: typography.semibold,
      color:      palette.textPrimary,
    },
    toggleSub: {
      fontSize: typography.xs,
      color:    palette.textMuted,
      marginTop: 2,
    },
    error: {
      fontSize:        typography.sm,
      color:           colors.danger,
      backgroundColor: '#FEE2E2',
      borderRadius:    radius.md,
      padding:         spacing.md,
      marginBottom:    spacing.md,
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius:    radius.md,
      padding:         spacing.md,
      alignItems:      'center',
      shadowColor:     colors.accent,
      shadowOffset:    { width: 0, height: 2 },
      shadowOpacity:   0.3,
      shadowRadius:    6,
      elevation:       4,
      marginTop:       spacing.md,
    },
    saveBtnDisabled: {
      backgroundColor: palette.textMuted,
      shadowOpacity:   0,
      elevation:       0,
    },
    saveBtnText: {
      color:      '#fff',
      fontSize:   typography.base,
      fontWeight: typography.bold,
    },
    tagsWrap: {
    marginBottom: spacing.md,
    },
    selectedTags: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           spacing.xs,
      marginBottom:  spacing.sm,
    },
    tagSelected: {
      paddingHorizontal: spacing.sm,
      paddingVertical:   3,
      backgroundColor:   colors.accentDim || '#DCFCE7',
      borderRadius:      radius.full,
    },
    tagSelectedText: {
      fontSize:   typography.xs,
      fontWeight: typography.semibold,
      color:      colors.accentText,
    },
    tagSuggestions: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           spacing.xs,
    },
    tagSuggestion: {
      paddingHorizontal: spacing.sm,
      paddingVertical:   3,
      borderRadius:      radius.full,
      borderWidth:       1,
      borderColor:       palette.border,
      backgroundColor:   palette.bgCard,
    },
    tagSuggestionText: {
      fontSize: typography.xs,
      color:    palette.textSecondary,
    },
  });
}