import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getFollowers, getFollowing, followUser, unfollowUser, isFollowing } from '../../../lib/social';
import { supabase } from '../../../lib/supabase';


export default function FollowersListScreen({ route, navigation }) {
  const { userId, type, currentUserId } = route.params;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [following, setFollowing] = useState({});

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
            // Charge les follows selon le type
            const data = type === 'followers'
            ? await getFollowers(userId)
            : await getFollowing(userId);

            // Extrait les IDs
            const ids = type === 'followers'
            ? data.map(d => d.follower_id)
            : data.map(d => d.following_id);

            // Si aucun résultat, on arrête
            if (ids.length === 0) { setUsers([]); return; }

            // Charge les profils correspondants
            const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, bio, avatar_url')
            .in('id', ids);

            setUsers(profiles || []);

            // Vérifie les follows si on est connecté
            if (currentUserId) {
            const followStatus = {};
            await Promise.all((profiles || []).map(async u => {
                followStatus[u.id] = await isFollowing(currentUserId, u.id);
            }));
            setFollowing(followStatus);
            }
        } catch (e) {
        } finally {
            setLoading(false);
        }
        }
      load();
    }, [userId, type])
  );

  async function handleFollow(targetId) {
    if (following[targetId]) {
      await unfollowUser(currentUserId, targetId);
    } else {
      await followUser(currentUserId, targetId);
    }
    setFollowing(f => ({ ...f, [targetId]: !f[targetId] }));
  }

  function renderItem({ item }) {
    const isSelf = item.id === currentUserId;
    return (
        <TouchableOpacity
            style={styles.userRow}
            onPress={() => {
                if (isSelf) {
                navigation.navigate('Main', { screen: 'Profil' });
                } else {
                navigation.navigate('PublicProfile', { profileId: item.id, userId: currentUserId });
                }
            }}
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

        {/* Bouton follow — pas sur son propre profil */}
        {!isSelf && currentUserId && (
          <TouchableOpacity
            style={[styles.followBtn, following[item.id] && styles.followingBtn]}
            onPress={() => handleFollow(item.id)}
          >
            <Text style={[styles.followBtnText, following[item.id] && styles.followingBtnText]}>
              {following[item.id] ? 'Suivi' : 'Suivre'}
            </Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.title}>{type === 'followers' ? 'Followers' : 'Suivi'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={
            <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: spacing.xl }}>
              {type === 'followers' ? 'Aucun follower.' : 'Ne suit personne.'}
            </Text>
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