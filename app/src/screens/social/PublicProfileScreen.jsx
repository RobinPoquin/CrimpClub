import { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { followUser, unfollowUser, isFollowing } from '../../../lib/social';
import { supabase } from '../../../lib/supabase';

export default function PublicProfileScreen({ route, navigation }) {
  const { profileId, userId } = route.params;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [profile, setProfile]     = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading]     = useState(true);

  // Charge le profil public au focus
  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const [{ data: prof }, followStatus] = await Promise.all([
            supabase.from('profiles').select('id, display_name, bio, avatar_url').eq('id', profileId).single(),
            isFollowing(userId, profileId),
          ]);
          setProfile(prof);
          setFollowing(followStatus);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [profileId, userId])
  );

  // Toggle follow/unfollow
  async function handleFollow() {
    if (following) {
      await unfollowUser(userId, profileId);
    } else {
      await followUser(userId, profileId);
    }
    setFollowing(f => !f);
  }

  const initials = profile?.display_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{profile?.display_name || 'Profil'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + infos */}
        <View style={styles.profileCard}>
          {profile?.avatar_url
            ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            : <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.initials}>{initials || '?'}</Text>
              </View>
          }
          <Text style={styles.name}>{profile?.display_name}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Bouton follow */}
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={handleFollow}
          >
            <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
              {following ? '✓ Suivi' : '+ Suivre'}
            </Text>
          </TouchableOpacity>
        </View>
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
    profileCard: {
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.xl,
      alignItems:      'center',
      borderWidth:     1,
      borderColor:     palette.border,
      gap:             spacing.sm,
    },
    avatar: {
      width:        80,
      height:       80,
      borderRadius: 40,
    },
    avatarFallback: {
      backgroundColor: colors.accent,
      alignItems:      'center',
      justifyContent:  'center',
    },
    initials: {
      fontSize:   typography.xxl,
      fontWeight: typography.black,
      color:      '#fff',
    },
    name: {
      fontSize:   typography.xl,
      fontWeight: typography.black,
      color:      palette.textPrimary,
    },
    bio: {
      fontSize:  typography.sm,
      color:     palette.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    followBtn: {
      paddingHorizontal: spacing.xl,
      paddingVertical:   spacing.sm,
      borderRadius:      radius.full,
      backgroundColor:   colors.accent,
      marginTop:         spacing.sm,
    },
    followingBtn: {
      backgroundColor: palette.bgInput,
      borderWidth:     1,
      borderColor:     palette.border,
    },
    followBtnText: {
      fontSize:   typography.base,
      fontWeight: typography.bold,
      color:      '#fff',
    },
    followingBtnText: {
      color: palette.textMuted,
    },
  });
}