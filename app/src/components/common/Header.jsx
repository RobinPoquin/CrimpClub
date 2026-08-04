import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

// Header réutilisable avec logo CrimpClub et bouton toggle thème
export default function Header({ onToggleTheme, theme, rightComponent, palette }) {
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

      {/* Droite : toggle thème + composant optionnel (ex: bouton +) */}
      <View style={styles.right}>
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
          <Text style={{ fontSize: 18 }}>{theme === 'light' ? '🌙' : '☀️'}</Text>
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