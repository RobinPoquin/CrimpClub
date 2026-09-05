import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getFollowRequests, allowFollow, followUser, getNotifications, deleteNotification, markNotificationsRead } from '../../../lib/social';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNotif } from '../../theme/NotifContext';

export default function NotificationsScreen({ route, navigation }) {
  const userId = route?.params?.userId;
  const { palette } = useTheme();
  const styles = makeStyles(palette);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { setNotifCount } = useNotif();

  // Charge les demandes de follow reçues
  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const [requestsData, notifsData] = await Promise.all([
            getFollowRequests(userId),
            getNotifications(userId),
          ]);
          // Charge les profils des demandeurs
          const withProfiles = await Promise.all(
            requestsData.map(async req => {
              const { data: prof } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', req.requester_id)
                .single();
              return { ...req, profile: prof };
            })
          );

          setRequests(withProfiles);
          setNotifications(notifsData.filter(n => n.type !== 'follow_request'));
          await markNotificationsRead(userId);
          setNotifCount(requestsData.length); // Reset — garde seulement les demandes
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
    
    // Supprime la notif follow_request
    await supabase
      .from('notifications')
      .delete()
      .eq('from_user_id', requesterId)
      .eq('user_id', userId)
      .eq('type', 'follow_request');

    if (accept) {
      await followUser(requesterId, userId);
      getNotifications(userId).then(data => setNotifications(data.filter(n => n.type !== 'follow_request')));
      // Crée une notif new_follower à la place
      await supabase
        .from('notifications')
        .insert({
          user_id:      userId,
          type:         'new_follower',
          from_user_id: requesterId,
        });
      // Notification à celui qui avait demandé
      await fetch('https://kskzkxsbriatufffsdvh.supabase.co/functions/v1/send-follow-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          followerId: requesterId,
          followingId: userId,
          type: 'accepted',
        })
      });
    }

    setRequests(r => r.filter(req => req.id !== requestId));
  }

  // Calcule le temps écoulé
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "À l'instant";
    if (mins < 60)  return `Il y a ${mins} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
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
        <View style={{ flex: 1 }}>
  <Text style={{ fontSize: typography.sm, color: palette.textPrimary }}>
    <Text style={{ fontWeight: typography.bold }}>{item.profile?.display_name}</Text>
    {' '}veut te suivre
  </Text>
  <Text style={{ fontSize: typography.xs, color: palette.textMuted, marginTop: 2 }}>
    {timeAgo(item.created_at)}
  </Text>
</View>

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
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {/* Demandes de follow */}
          {requests.map(item => renderItem({ item }))}

          {/* Notifications */}
          {notifications.map(notif => (
            <View key={notif.id} style={[styles.row, { 
              justifyContent: 'space-between',
              backgroundColor: notif.read ? palette.bgCard : palette.bgInput,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                {notif.from_user?.avatar_url
                  ? <Image source={{ uri: notif.from_user.avatar_url }} style={styles.avatar} />
                  : <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {notif.from_user?.display_name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    <Text style={{ fontWeight: typography.bold }}>{notif.from_user?.display_name}</Text>
                    {' '}{notif.type === 'new_follower' ? 'a commencé à te suivre' : 
                    notif.type === 'follow_request' ? 'veut te suivre' :
                    'a accepté ta demande de suivi'}                  
                  </Text>
                  <Text style={{ fontSize: typography.xs, color: palette.textMuted, marginTop: 2 }}>
                    {timeAgo(notif.created_at)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  await deleteNotification(notif.id);
                  setNotifications(n => n.filter(x => x.id !== notif.id));
                  setNotifCount(prev => Math.max(0, prev - 1));
                }}
                style={{ padding: spacing.xs }}
              >
                <Ionicons name="close" size={18} color={palette.textMuted} />
              </TouchableOpacity>
            </View>
          ))}

          {requests.length === 0 && notifications.length === 0 && (
            <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: spacing.xl }}>
              Aucune notification.
            </Text>
          )}
        </ScrollView>
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