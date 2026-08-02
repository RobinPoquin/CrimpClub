import { View, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../theme';

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Profil</Text>
      <TouchableOpacity
        style={{ marginTop: 20, padding: 12, backgroundColor: colors.danger, borderRadius: 8 }}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}