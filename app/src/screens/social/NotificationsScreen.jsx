import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getFollowRequests, allowFollow, followUser } from '../../../lib/social';
import { supabase } from '../../../lib/supabase';

export default function NotificationsScreen({ route, navigation }) {
  const userId = route?.params?.userId;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Charge les demandes de follow reçues
  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const data = await getFollowRequests(userId);
          // Charge le profil de chaque demandeur
          const withProfiles = await Promise.all(
            data.map(async req => {
              const { data: prof } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', req.requester_id)
                .single();
              return { ...req, profile: prof };
            })
          );
          setRequests(withProfiles);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [userId])
  );

  // Accepte ou refuse une demande
  async function handleRequest(requestId, requesterId, accept) {
    await allowFollow(requestId, accept);
    if (accept) {
      // Crée le follow dans la table follows
      await followUser(requesterId, userId);
    }
    // Retire la demande de la liste
    setRequests(r => r.filter(req => req.id !== requestId));
  }

  function renderItem({ item }) {
    return (
      <View style={styles.row}>
        {/* Avatar */}
        {item.profile?.avatar_url
          ? <Image source={{ uri: item.profile.avatar_url }} style={styles.avatar} />
          : <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {item.profile?.display_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
        }

        {/* Nom */}
        <Text style={styles.name}>{item.profile?.display_name}</Text>

        {/* Boutons */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={() => handleRequest(item.id, item.requester_id, true)}
          >
            <Text style={styles.btnText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: palette.bgInput, borderWidth: 1, borderColor: palette.border }]}
            onPress={() => handleRequest(item.id, item.requester_id, false)}
          >
            <Text style={[styles.btnText, { color: palette.textSecondary }]}>Refuser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.lg }}
          ListEmptyComponent={
            <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: spacing.xl }}>
              Aucune demande en attente.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.bg },
    header: {
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl, 
      paddingVertical: spacing.md,
      borderBottomWidth: 1, 
      borderBottomColor: palette.border,
      backgroundColor: palette.bgCard,
    },
    back:  { 
        fontSize: typography.base, 
        color: colors.accent, 
        fontWeight: typography.semibold 
    },
    title: { 
        fontSize: typography.lg, 
        fontWeight: typography.black, 
        color: palette.textPrimary 
    },
    row: {
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: spacing.md,
      backgroundColor: palette.bgCard, 
      borderRadius: radius.lg,
      padding: spacing.md, 
      marginBottom: spacing.sm,
      borderWidth: 1, 
      borderColor: palette.border,
    },
    avatar: { 
        width: 44, 
        height: 44, 
        borderRadius: 22 
    },
    avatarFallback: { 
        backgroundColor: colors.accent, 
        alignItems: 'center', 
        justifyContent: 'center' },
    name: { 
        flex: 1, 
        fontSize: typography.base, 
        fontWeight: typography.bold, 
        color: palette.textPrimary 
    },
    btn: { 
        paddingHorizontal: spacing.md, 
        paddingVertical: spacing.xs, 
        borderRadius: radius.full 
    },
    btnText: { 
        fontSize: typography.sm, 
        fontWeight: typography.bold, 
        color: '#fff' 
    },
  });
}