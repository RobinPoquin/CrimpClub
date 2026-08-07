import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Image, ScrollView, Modal
} from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { useAscents } from '../../hooks/useAscents';
import { deleteAscent } from '../../../lib/db';
import AscentCard from '../../components/ascent/AscentCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import Header from '../../components/common/Header';
import { getProjects } from '../../../lib/projects';
import ProjectCard from '../../components/project/ProjectCard';
import { useFocusEffect } from '@react-navigation/native';

const TYPE_FILTERS = ["Tous", "Bloc", "Diff", "Trad", "Grande voie"];

export default function LogbookScreen({ route, navigation }) {
  // userId passé depuis la navigation
  const userId = route?.params?.userId;

  const { ascents, loading, loadingMore, hasMore, reload, loadMore } = useAscents(userId);
  const { theme, toggleTheme, palette } = useTheme();
  const styles = makeStyles(palette);


  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedAscent, setSelectedAscent] = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(false);

  const [activeTab, setActiveTab] = useState('logbook'); // 'logbook' | 'projets'
  const [projects, setProjects] = useState([]);

  // Sous-onglet de la section projets
  const [projectTab, setProjectTab] = useState('en_cours');

  // Recharge les ascensions à chaque fois qu'on revient sur cet écran
  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      reload();
    });
    return unsubscribe;
  }, [navigation]);

  // Recharge les projets quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      async function loadProjects() {
        if (!userId) return;
        const data = await getProjects(userId);
        setProjects(data);
      }
      loadProjects();
    }, [userId])
  );

  // Filtre les ascensions selon le type et la recherche
  const filtered = ascents.filter(a => {
    const matchType   = filter === "Tous" || a.type === filter;
    const matchSearch = !search ||
      a.routeName?.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase()) ||
      a.grade?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Rendu de chaque carte d'ascension
  function renderItem({ item }) {
    if (activeTab === 'projets') {
      return (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <ProjectCard
            project={item}
            onPress={() => navigation.navigate('ProjectDetail', { project: item, userId })}
          />
        </View>
      );
    }
    return (
      <View style={{ paddingHorizontal: spacing.lg }}>
        <AscentCard
          ascent={item}
          onMenu={() => setSelectedAscent(item)}
        />
      </View>
    );
  }

  // Composant affiché en bas de liste pendant le chargement
  function renderFooter() {
    if (!loadingMore) return null;
    return (
      <ActivityIndicator
        color={colors.accent}
        style={{ padding: spacing.lg }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bgCard }]} edges={['top']}>
      <FlatList
        data={activeTab === 'logbook' 
          ? filtered 
          : projects.filter(p => p.status === projectTab)
        }
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        style={{ width: '100%', backgroundColor: palette.bg }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={{ flex: 1, width: '100%' }}>
            {/* Header + recherche avec fond commun et bordure en bas */}
            <View style={{ backgroundColor: palette.bgCard }}>
              <Header
                theme={theme}
                onToggleTheme={toggleTheme}
                palette={palette}
                rightComponent={
                  <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAscent', { userId })}>
                    <Text style={styles.addBtnText}>＋</Text>
                  </TouchableOpacity>
                }
              />
              </View>
              {activeTab === 'logbook' && (
              <View style={{ backgroundColor: palette.bg, paddingTop: spacing.md }}>
                <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher une voie, un site…"
                    placeholderTextColor={palette.textMuted}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
              </View>
            )}

            {/* Onglets Logbook / Projets */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: palette.bg }}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'logbook' && styles.tabActive]}
                onPress={() => setActiveTab('logbook')}
              >
                <Text style={[styles.tabText, activeTab === 'logbook' && styles.tabTextActive]}>📋 Logbook</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'projets' && styles.tabActive]}
                onPress={() => setActiveTab('projets')}
              >
                <Text style={[styles.tabText, activeTab === 'projets' && styles.tabTextActive]}>
                  🎯 Projets {projects.filter(p => p.status === 'en_cours').length > 0 && `(${projects.filter(p => p.status === 'en_cours').length})`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sous-onglets projets — visibles uniquement sur l'onglet Projets */}
            {activeTab === 'projets' && (
              <View style={{ backgroundColor: palette.bg, paddingBottom: spacing.sm }}>
                
                {/* Ligne 1 : titre + bouton ajouter */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                  <Text style={{ fontSize: typography.xl, fontWeight: typography.black, color: palette.textPrimary }}>
                    Mes projets
                  </Text>
                  <TouchableOpacity
                    style={styles.addProjectBtn}
                    onPress={() => navigation.navigate('AddProject', { userId })}
                  >
                    <Text style={{ color: '#fff', fontSize: 18 }}>＋</Text>
                  </TouchableOpacity>
                </View>

                {/* Ligne 2 : sous-onglets avec fond commun */}
                <View style={{ flexDirection: 'row', backgroundColor: palette.bgInput, borderRadius: radius.md, marginHorizontal: spacing.lg, padding: 3 }}>
                  {['en_cours', 'reussi', 'abandonne'].map(tab => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.subTab, projectTab === tab && styles.subTabActive]}
                      onPress={() => setProjectTab(tab)}
                    >
                      <Text style={[styles.subTabText, projectTab === tab && styles.subTabTextActive]}>
                        {tab === 'en_cours'  ? 'En cours' :
                        tab === 'reussi'    ? 'Réussis' :
                        'Abandonnés'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Filtres — uniquement sur l'onglet Logbook */}
            {activeTab === 'logbook' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
                style={{ marginBottom: spacing.sm, height: 60 }}
              >
                {TYPE_FILTERS.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, filter === item && styles.chipActive]}
                    onPress={() => setFilter(item)}
                  >
                    <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🧗</Text>
                <Text style={styles.emptyTitle}>Aucune ascension ici.</Text>
                <Text style={styles.emptySubtitle}>
                  {ascents.length === 0
                    ? "Enregistre ta première voie pour commencer."
                    : "Essaie un autre filtre."}
                </Text>
              </View>
            )}
          </View>
        }
      />

      {/* Loading initial */}
      {loading && (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      )}

      <Modal
        visible={!!selectedAscent}
        transparent
        animationType="fade"
        onRequestClose={() => { setSelectedAscent(null); setConfirmDelete(false); }}
      >
        {/* Conteneur principal — fond sombre + sheet en bas */}
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          
          {/* Zone transparente cliquable pour fermer */}
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => { setSelectedAscent(null); setConfirmDelete(false); }}
          />

          {/* Sheet blanc en bas */}
          <View style={{
            backgroundColor:      colors.light.bgCard,
            borderTopLeftRadius:  20,
            borderTopRightRadius: 20,
            padding:              spacing.xl,
            paddingBottom:        spacing.xxl,
          }}>
            {/* Poignée */}
            <View style={{
              width: 40, height: 4,
              backgroundColor: colors.light.border,
              borderRadius:    2,
              alignSelf:       'center',
              marginBottom:    spacing.lg,
            }} />

            {/* Titre — cotation ou couleur + nom de la voie */}
            <Text style={{ fontSize: typography.xl, fontWeight: typography.black, marginBottom: spacing.lg }}>
              {selectedAscent?.grade || selectedAscent?.colorName || '?'}
              {selectedAscent?.routeName ? ` — ${selectedAscent.routeName}` : ''}
            </Text>

            {/* Bouton modifier */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.light.border }}
              onPress={() => {
                setSelectedAscent(null);
                navigation.navigate('EditAscent', { ascent: selectedAscent, userId });
              }}
            >
              <Text style={{ fontSize: 20 }}>✏️</Text>
              <Text style={{ fontSize: typography.base, fontWeight: typography.medium, color: colors.light.textPrimary }}>Modifier l'ascension</Text>
            </TouchableOpacity>

            {/* Bouton supprimer — demande confirmation au 2e appui */}
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                paddingVertical:   spacing.md,
                backgroundColor:   confirmDelete ? '#FEE2E2' : 'transparent',
                borderRadius:      confirmDelete ? radius.md : 0,
                paddingHorizontal: confirmDelete ? spacing.md : 0,
                marginTop:         spacing.xs,
              }}
              onPress={async () => {
                if (!confirmDelete) { setConfirmDelete(true); return; }
                await deleteAscent(selectedAscent.id);
                setSelectedAscent(null);
                setConfirmDelete(false);
                reload();
              }}
            >
              <Text style={{ fontSize: 20 }}>🗑️</Text>
              <Text style={{ fontSize: typography.base, fontWeight: typography.medium, color: colors.danger }}>
                {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
              </Text>
            </TouchableOpacity>

            {/* Bouton annuler */}
            <TouchableOpacity
              style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.light.bgInput, borderRadius: radius.md, alignItems: 'center' }}
              onPress={() => { setSelectedAscent(null); setConfirmDelete(false); }}
            >
              <Text style={{ fontSize: typography.base, fontWeight: typography.semibold, color: colors.light.textSecondary }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.bg,
      overflow: 'visible',
    },
    header: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      alignItems:     'center',
      paddingHorizontal: spacing.lg,
      paddingTop:     spacing.xl,
      paddingBottom:  spacing.md,
    },
    brand: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           spacing.sm,
    },
    logo: {
      width:  28,
      height: 28,
    },
    brandName: {
      fontSize:      typography.lg,
      fontWeight:    typography.black,
      letterSpacing: -0.5,
      color:         palette.textPrimary,
    },
    addBtn: {
      width:           36,
      height:          36,
      borderRadius:    18,
      backgroundColor: colors.accent,
      alignItems:      'center',
      justifyContent:  'center',
      shadowColor:     colors.accent,
      shadowOffset:    { width: 0, height: 2 },
      shadowOpacity:   0.35,
      shadowRadius:    6,
      elevation:       4,
    },
    addBtnText: {
      fontSize:   22,
      color:      '#fff',
      lineHeight: 26,
    },
    searchBar: {
      flexDirection:     'row',
      alignItems:        'center',
      backgroundColor:   palette.bgInput,
      borderRadius:      radius.md,
      marginHorizontal:  spacing.lg,
      marginBottom:      spacing.sm,
      paddingHorizontal: spacing.lg,
      borderWidth:       1.5,
      borderColor:       palette.border,
    },
    searchIcon: {
      fontSize:    15,
      marginRight: spacing.sm,
    },
    searchInput: {
      flex:            1,
      fontSize:        typography.base,
      color:           palette.textPrimary,
      paddingVertical: spacing.sm,
    },
    filterList: {
      paddingHorizontal: spacing.lg,
      paddingBottom:     spacing.sm,
      paddingTop:        spacing.xs,
      gap:               spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical:   spacing.sm,
      borderRadius:      radius.full,
      borderWidth:       1.5,
      borderColor:       palette.border,
      backgroundColor:   palette.bgCard,
      alignSelf:         'flex-start',
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor:     colors.accent,
    },
    chipText: {
      fontSize:   typography.sm,
      fontWeight: typography.semibold,
      color:      palette.textSecondary,
    },
    chipTextActive: {
      color: '#fff',
    },
    list: {
      paddingBottom: spacing.lg,
      gap:           spacing.sm,
    },
    emptyState: {
      flex:           1,
      alignItems:     'center',
      justifyContent: 'center',
      padding:        spacing.xl,
    },
    emptyIcon: {
      fontSize:     48,
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      fontSize:     typography.md,
      fontWeight:   typography.bold,
      color:        palette.textPrimary,
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      fontSize:  typography.sm,
      color:     palette.textSecondary,
      textAlign: 'center',
    },
    tab: {
      flex:              1,
      paddingVertical:   spacing.sm,
      borderRadius:      radius.md,
      borderWidth:       1.5,
      borderColor:       palette.border,
      backgroundColor:   palette.bgInput,
      alignItems:        'center',
    },
    tabActive: {
      backgroundColor: palette.bgCard,
      borderColor:     colors.accent,
    },
    tabText: {
      fontSize:   typography.sm,
      fontWeight: typography.semibold,
      color:      palette.textMuted,
    },
    tabTextActive: {
      color: palette.textPrimary,
    },
    subTab: {
      flex:            1,
      paddingVertical: spacing.md,
      borderRadius:    radius.sm,
      backgroundColor: 'transparent',
      alignItems:      'center',
      justifyContent:  'center',
    },
    subTabActive: {
      backgroundColor: palette.bgCard,
      borderRadius:    radius.sm,
    },
    subTabText: {
      fontSize:   typography.sm,
      fontWeight: typography.semibold,
      color:      palette.textMuted,
    },
    subTabTextActive: {
      color: palette.textPrimary,
      fontWeight: typography.bold
    },
    addProjectBtn: {
      width:           36,
      height:          36,
      borderRadius:    18,
      backgroundColor: colors.accent,
      alignItems:      'center',
      justifyContent:  'center',
    },
    subTabsContainer: {
      flexDirection:     'row',
      backgroundColor:   palette.bgInput, // fond commun
      borderRadius:      radius.md,
      padding:           3, // petit padding pour l'effet "pill"
      marginHorizontal:  spacing.lg,
      marginBottom:      spacing.sm,
    },
  });
}
