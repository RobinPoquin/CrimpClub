import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius } from '../../theme';
import { supabase } from '../../../lib/supabase';

export default function AvatarUploader({ userId, currentUrl, onUploaded, size = 72, folder = 'avatars', placeholder = '👤' }) {
  const [loading, setLoading]   = useState(false);
  const [localUrl, setLocalUrl] = useState(currentUrl);

  // Sync si currentUrl change depuis le parent
  useEffect(() => { setLocalUrl(currentUrl); }, [currentUrl]);

  async function pick() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorise l\'accès à ta galerie dans les réglages.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const uri      = result.assets[0].uri;
        const path     = `${userId}/${folder}_${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' });

        const { error } = await supabase.storage
          .from('avatars')
          .upload(path, formData, { cacheControl: '3600', upsert: true });

        if (error) throw new Error(error.message);

        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        setLocalUrl(data.publicUrl);
        onUploaded(data.publicUrl);
      } catch (e) {
        Alert.alert('Erreur', e.message);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <TouchableOpacity
      onPress={pick}
      disabled={loading}
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {localUrl
        ? <Image source={{ uri: localUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        : <Text style={{ fontSize: size * 0.4 }}>{placeholder}</Text>
      }
      <View style={styles.overlay}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 14 }}>📷</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth:     2,
    borderColor:     colors.accent,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    marginBottom:    12,
  },
  overlay: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems:      'center',
    paddingVertical: 3,
  },
});