import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { getAscents } from '../../../lib/db';
import { getGyms } from '../../../lib/gyms';
import { getLocations } from '../../../lib/locations';
import { canAccessSimcomp } from '../../../lib/simcomp';
import Header from '../../components/common/Header';

export default function ProfileScreen({ route, navigation }) {
  const userId = route?.params?.userId;
  const { palette, theme, toggleTheme } = useTheme();
  const styles = makeStyles(palette);

  const [user, setUser]         = useState(null);
  const [ascents, setAscents]   = useState([]);
  const [gyms, setGyms]         = useState([]);
  const [spots, setSpots]       = useState([]);

  // Charge les données au focus
  useFocusEffect(
    useCallback(() => {
      async function load() {
        const { data: { user: u } } = await supabase.auth.getUser();
        setUser(u);
        const [a, g, l] = await Promise.all([
          getAscents(userId),
          getGyms(userId),
          getLocations(userId),
        ]);
        setAscents(a);
        setGyms(g);
        setSpots(l.filter(loc => loc.is_outdoor));
      }
      load();
    }, [userId])
  );

  // Initiales pour l'avatar par défaut
  const displayName = user?.user_metadata?.display_name || '';
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarUrl   = user?.user_metadata?.avatar_url;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  // 3 dernières ascensions
  const lastThree = ascents.slice(0, 3);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bgCard }]} edges={['top']}>
      <Header theme={theme} onToggleTheme={toggleTheme} palette={palette} />
      <View style={{ height: 1, backgroundColor: palette.border }} />

      <ScrollView style={{ backgroundColor: palette.bg }} contentContainerStyle={styles.content}>

        {/* Avatar + infos */}
        <View style={styles.profileHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.initials}>{initials || '?'}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName || 'Grimpeur'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.user_metadata?.bio && (
              <Text style={styles.bio}>{user.user_metadata.bio}</Text>
            )}
          </View>
        </View>

        {/* Stats rapides */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{ascents.length}</Text>
            <Text style={styles.statLabel}>ASCENSIONS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{gyms.length}</Text>
            <Text style={styles.statLabel}>SALLES</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{spots.length}</Text>
            <Text style={styles.statLabel}>SITES</Text>
          </View>
        </View>

        {/* 3 dernières ascensions */}
        {lastThree.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dernières ascensions</Text>
            {lastThree.map(a => (
              <View key={a.id} style={styles.ascentRow}>
                {/* Pastille couleur ou cotation */}
                <View style={styles.ascentGrade}>
                  {a.colorHex
                    ? <View style={[styles.colorDot, { backgroundColor: a.colorHex }]} />
                    : <Text style={styles.gradeText}>{a.grade}</Text>
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ascentName}>{a.routeName || a.colorName || a.type}</Text>
                  <Text style={styles.ascentMeta}>{a.location} · {a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</Text>
                </View>
                {/* Badge résultat */}
                <View style={[styles.badge, { backgroundColor: a.result === 'Flash' ? '#DBEAFE' : '#FEF3C7' }]}>
                  <Text style={[styles.badgeText, { color: a.result === 'Flash' ? '#1D4ED8' : '#92400E' }]}>{a.result}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Settings', { userId })}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>Paramètres du compte</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('GymManager', { userId })}>
            <Text style={styles.menuIcon}>🏟️</Text>
            <Text style={styles.menuText}>Mes salles & couleurs</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={styles.menuSub}>{gyms.length} salle{gyms.length !== 1 ? 's' : ''}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('SpotManager', { userId })}>
            <Text style={styles.menuIcon}>🌿</Text>
            <Text style={styles.menuText}>Mes spots extérieurs</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={styles.menuSub}>{spots.length} spot{spots.length !== 1 ? 's' : ''}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          {/* SimComp — accès restreint */}
          {canAccessSimcomp(userId) && (
            <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('SimComp', { userId })}>
              <Text style={styles.menuIcon}>🏆</Text>
              <Text style={styles.menuText}>SimComp</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}

          <View style={styles.menuRow}>
            <Text style={styles.menuIcon}>🗓️</Text>
            <Text style={styles.menuText}>Membre depuis</Text>
            <Text style={styles.menuSub}>{memberSince}</Text>
          </View>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(palette) {
  return StyleSheet.create({
    container:    { flex: 1 },
    content:      { padding: spacing.lg, gap: spacing.md },
    profileHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', backgroundColor: palette.bgCard, borderRadius: radius.lg, padding: spacing.lg },
    avatar:       { width: 64, height: 64, borderRadius: 32 },
    avatarFallback: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    initials:     { fontSize: typography.xl, fontWeight: typography.black, color: '#fff' },
    name:         { fontSize: typography.lg, fontWeight: typography.black, color: palette.textPrimary },
    email:        { fontSize: typography.xs, color: palette.textMuted, marginTop: 2 },
    bio:          { fontSize: typography.sm, color: palette.textSecondary, marginTop: 4, fontStyle: 'italic' },
    statsRow:     { flexDirection: 'row', backgroundColor: palette.bgCard, borderRadius: radius.lg, overflow: 'hidden' },
    statItem:     { flex: 1, alignItems: 'center', padding: spacing.md, borderRightWidth: 1, borderRightColor: palette.border },
    statValue:    { fontSize: typography.xxl, fontWeight: typography.black, color: palette.textPrimary },
    statLabel:    { fontSize: 9, fontWeight: '700', color: palette.textMuted, letterSpacing: 0.5, marginTop: 2 },
    section:      { backgroundColor: palette.bgCard, borderRadius: radius.lg, overflow: 'hidden' },
    sectionTitle: { fontSize: typography.xs, fontWeight: typography.bold, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border },
    ascentRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border },
    ascentGrade:  { width: 40, alignItems: 'center' },
    colorDot:     { width: 20, height: 20, borderRadius: 10 },
    gradeText:    { fontSize: typography.lg, fontWeight: typography.black, color: palette.textPrimary },
    ascentName:   { fontSize: typography.sm, fontWeight: typography.semibold, color: palette.textPrimary },
    ascentMeta:   { fontSize: typography.xs, color: palette.textMuted },
    badge:        { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
    badgeText:    { fontSize: typography.xs, fontWeight: typography.bold },
    menuRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: palette.border },
    menuIcon:     { fontSize: 18 },
    menuText:     { flex: 1, fontSize: typography.base, color: palette.textPrimary },
    menuSub:      { fontSize: typography.sm, color: palette.textMuted },
    chevron:      { fontSize: 18, color: palette.textMuted },
    signOutBtn:   { padding: spacing.md, alignItems: 'center' },
    signOutText:  { fontSize: typography.base, color: colors.danger, fontWeight: typography.semibold },
  });
}