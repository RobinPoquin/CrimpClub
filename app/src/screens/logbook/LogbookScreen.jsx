import { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useAscents } from '../../hooks/useAscents';
import { deleteAscent } from '../../../lib/db';
import AscentCard from '../../components/ascent/AscentCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';

const TYPE_FILTERS = ["Tous", "Bloc", "Diff", "Trad", "Grande voie"];

export default function LogbookScreen({ route }) {
  // userId passé depuis la navigation
  const userId = route?.params?.userId;

  const { ascents, loading, loadingMore, hasMore, load, loadMore } = useAscents(userId);

  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  // Recharge les ascensions à chaque fois qu'on revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
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
    return (
      <View style={{ paddingHorizontal: spacing.lg }}>
        <AscentCard
          ascent={item}
          onDelete={async () => {
            await deleteAscent(item.id);
            load();
          }}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        style={{ width: '100%' }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View style={{ flex: 1, width: '100%' }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Mon logbook</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Text style={styles.addBtnText}>＋</Text>
              </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une voie, un site…"
                placeholderTextColor={colors.light.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Filtres */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              style={{ marginBottom: spacing.sm }}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.bg,
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
  title: {
    fontSize:   typography.xxl,
    fontWeight: typography.black,
    letterSpacing: -0.5,
    color: colors.light.textPrimary,
  },
  addBtn: {
    width:  36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:    colors.accent,
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.35,
    shadowRadius:   6,
    elevation:      4,
  },
  addBtnText: {
    fontSize:   22,
    color:      '#fff',
    lineHeight: 26,
  },
  searchBar: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: colors.light.bgInput,
    borderRadius:   radius.md,
    marginHorizontal: spacing.lg,
    marginBottom:   spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth:    1.5,
    borderColor:    colors.light.border,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex:     1,
    fontSize: typography.base,
    color:    colors.light.textPrimary,
    paddingVertical: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingBottom:     spacing.sm,
    paddingTop:        spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderRadius:      radius.full,
    borderWidth:       1.5,
    borderColor:       colors.light.border,
    backgroundColor:   colors.light.bgCard,
    alignSelf:         'flex-start',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor:     colors.accent,
  },
  chipText: {
    fontSize:   typography.sm,
    fontWeight: typography.semibold,
    color:      colors.light.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    paddingBottom:     spacing.lg,
    gap:               spacing.sm,
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
    color:        colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sm,
    color:    colors.light.textSecondary,
    textAlign: 'center',
  },
});