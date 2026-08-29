import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { useState, useEffect } from 'react';
import { getFollowRequests } from '../../../lib/social';
import { Ionicons } from '@expo/vector-icons';

// Header réutilisable avec logo CrimpClub et bouton toggle thème
export default function Header({ onToggleTheme, theme, rightComponent, palette, userId, navigation }) {

  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    getFollowRequests(userId).then(data => setNotifCount(data.length));
  }, [userId]);

  return (
    <View style={[styles.header, { 
      backgroundColor: palette?.bgCard || colors.light.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: palette?.border || colors.light.border,
    }]}>
      {/* Logo + nom */}
      <View style={styles.brand}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        {/* Couleur dynamique selon le thème */}
        <Text style={[styles.brandName, { color: palette?.textPrimary || colors.light.textPrimary }]}>
          CrimpClub
        </Text>
      </View>

      <View style={styles.right}>
        {/* Cloche notifications */}
        <TouchableOpacity onPress={() => navigation.navigate('Notifications', { userId })}>
          <View style={{ position: 'relative' }}>
            <Text style={{ fontSize: 22 }}>
              <Ionicons name="notifications-outline" size={22} color={palette?.textPrimary} />
            </Text>
            {notifCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -4, right: -4,
                width: 16, height: 16,
                borderRadius: 8,
                backgroundColor: colors.danger,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{notifCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Droite : toggle thème + composant optionnel (ex: bouton +) */}
        <TouchableOpacity 
          onPress={onToggleTheme}
          style={{
            width:           36,
            height:          36,
            borderRadius:    18,
            borderWidth:     2,
            borderColor:     colors.accent,
            alignItems:      'center',
            justifyContent:  'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>{theme === 'light' ? 
            <Ionicons name="moon-outline" size={18} color={palette?.textPrimary} /> : 
            <Ionicons name="sunny-outline" size={18} color={palette?.textPrimary} />}
          </Text>
        </TouchableOpacity>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
  logo: {
    width:  28,
    height: 28,
    borderRadius: 6,
  },
  brandName: {
    fontSize:      typography.lg,
    fontWeight:    typography.black,
    letterSpacing: -0.5,
    color: colors.light.textPrimary,
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
  },
});