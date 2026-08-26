import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, FlatList } from 'react-native';
import { useState, useCallback } from 'react';
import { colors, typography, spacing, radius } from '../../theme';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { getAscents } from '../../../lib/db';
import AscentCard from '../../components/ascent/AscentCard';


export default function PublicLogbookScreen({ route, navigation }) {

    const [ascents, setAscents]   = useState([]);
    const [loading, setLoading]     = useState(true);

    const { profileId, filter } = route.params;
    const { palette } = useTheme();
    const styles = makeStyles(palette);

    const filtered = ascents.filter(a => {
    if (filter === 'blocs') return a.type === 'Bloc';
    if (filter === 'voies') return a.type !== 'Bloc';
    return true; // 'all' → tout garder
    });
    // Charge le profil public au focus
    useFocusEffect(
        useCallback(() => {
        async function load() {
            setLoading(true);
            try {
                const ascentsData = await getAscents(profileId);
                setAscents(ascentsData);
            } finally {
                setLoading(false);
            }
        }
        load();
        }, [profileId])
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.cancelBtn}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.title}>LogBook</Text>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={{ paddingHorizontal: spacing.lg }}>
                    <AscentCard ascent={item} />
                    </View>
                )}
            />
        </SafeAreaView>
    )
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
    profileHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.lg,
    },
    statsRight: {
    flex:           1,
    flexDirection:  'row',
    justifyContent: 'space-around',
    },
    statItem: {
    alignItems: 'center',
    },
    statValue: {
    fontSize:   typography.xl,
    fontWeight: typography.black,
    color:      palette.textPrimary,
    },
    statLabel: {
    fontSize:      9,
    fontWeight:    '700',
    color:         palette.textMuted,
    letterSpacing: 0.5,
    marginTop:     2,
    },
    bioSection: {
    marginTop: spacing.md,
    },
    name: {
    fontSize:   typography.lg,
    fontWeight: typography.black,
    color:      palette.textPrimary,
    },
    bio: {
    fontSize:  typography.sm,
    color:     palette.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    },
    section: {
      backgroundColor: palette.bgCard,
      borderRadius:    radius.lg,
      padding:         spacing.lg,
      borderWidth:     1,
      borderColor:     palette.border,
      marginBottom:    spacing.md,
    },
    sectionTitle: {
      fontSize:      typography.sm,
      fontWeight:    typography.bold,
      color:         palette.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom:  spacing.md,
    },
    pyrRow: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           spacing.sm,
      marginBottom:  spacing.xs,
    },
    pyrLabel: {
      width:      40,
      fontSize:   typography.xs,
      fontWeight: typography.semibold,
      color:      palette.textSecondary,
    },
    pyrBarWrap: {
      flex:            1,
      height:          20,
      backgroundColor: palette.bgInput,
      borderRadius:    4,
      overflow:        'hidden',
      flexDirection:   'row',
    },
    pyrBar: {
      height: '100%',
    },
    pyrCount: {
      width:     20,
      fontSize:  typography.xs,
      color:     palette.textMuted,
      textAlign: 'right',
    },
  });
}