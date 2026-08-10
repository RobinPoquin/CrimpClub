import { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { searchUsers, followUser, unfollowUser, isFollowing } from '../../../lib/social';

export default function SearchScreen({ route, navigation }) {
  const userId = route?.params?.userId;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [following, setFollowing] = useState({});

  // Recherche avec debounce simple
  async function handleSearch(text) {
    setQuery(text);
    if (text.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await searchUsers(text);
      // Filtre l'utilisateur courant
      const filtered = data.filter(u => u.id !== userId);
      setResults(filtered);

      // Vérifie les follows en parallèle
      const followStatus = {};
      await Promise.all(filtered.map(async u => {
        followStatus[u.id] = await isFollowing(userId, u.id);
      }));
      setFollowing(followStatus);
    } finally {
      setLoading(false);
    }
  }

  // Toggle follow/unfollow
  async function handleFollow(targetId) {
    if (following[targetId]) {
      await unfollowUser(userId, targetId);
    } else {
      await followUser(userId, targetId);
    }
    setFollowing(f => ({ ...f, [targetId]: !f[targetId] }));
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => navigation.navigate('PublicProfile', { profileId: item.id, userId })}
      >
        {/* Avatar */}
        {item.avatar_url
          ? <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          : <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {item.display_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
        }

        {/* Infos */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.display_name}</Text>
          {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
        </View>

        {/* Bouton follow */}
        <TouchableOpacity
          style={[styles.followBtn, following[item.id] && styles.followingBtn]}
          onPress={() => handleFollow(item.id)}
        >
          <Text style={[styles.followBtnText, following[item.id] && styles.followingBtnText]}>
            {following[item.id] ? 'Suivi' : 'Suivre'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rechercher</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Recherche un grimpeur..."
          placeholderTextColor={palette.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
      </View>

      {/* Résultats */}
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={
            query.length >= 2 ? (
              <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: spacing.xl }}>
                Aucun grimpeur trouvé.
              </Text>
            ) : null
          }
        />
      )}
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
    searchBar: {
      flexDirection:     'row',
      alignItems:        'center',
      backgroundColor:   palette.bgInput,
      borderRadius:      radius.md,
      margin:            spacing.lg,
      paddingHorizontal: spacing.md,
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
    userRow: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             spacing.md,
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.md,
      marginBottom:    spacing.sm,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    avatar: {
      width:        44,
      height:       44,
      borderRadius: 22,
    },
    avatarFallback: {
      backgroundColor: colors.accent,
      alignItems:      'center',
      justifyContent:  'center',
    },
    name: {
      fontSize:   typography.base,
      fontWeight: typography.bold,
      color:      palette.textPrimary,
    },
    bio: {
      fontSize:  typography.sm,
      color:     palette.textMuted,
      marginTop: 2,
    },
    followBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical:   spacing.xs,
      borderRadius:      radius.full,
      backgroundColor:   colors.accent,
    },
    followingBtn: {
      backgroundColor: palette.bgInput,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    followBtnText: {
      fontSize:   typography.sm,
      fontWeight: typography.bold,
      color:      '#fff',
    },
    followingBtnText: {
      color: palette.textMuted,
    },
  });
}