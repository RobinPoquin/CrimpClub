import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  ScrollView, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { colors, typography, spacing, radius } from '../../theme';
import { uploadMedia } from '../../../lib/storage';

export default function MediaUploader({ userId, mediaList = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  // Demande la permission d'accès à la galerie
  async function requestPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission refusée", "Autorise l'accès à ta galerie dans les réglages.");
      return false;
    }
    return true;
  }

  // Sélectionne et uploade immédiatement une photo
  async function pickPhoto() {
    if (!await requestPermission()) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        // Upload immédiat vers Supabase
        const uploaded = await uploadMedia(userId, {
          uri:  result.assets[0].uri,
          type: 'photo',
        });
        onChange([...mediaList, { ...uploaded, uploaded: true }]);
      } catch (e) {
        Alert.alert("Erreur", e.message);
      } finally {
        setUploading(false);
      }
    }
  }

  // Sélectionne et uploade immédiatement une vidéo
  async function pickVideo() {
    if (!await requestPermission()) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality:    0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        // Génère une miniature pour l'aperçu
        let thumbnailUri = null;
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(result.assets[0].uri, { time: 0 });
          thumbnailUri = uri;
        } catch (e) {}

        // Upload immédiat vers Supabase
        const uploaded = await uploadMedia(userId, {
          uri:  result.assets[0].uri,
          type: 'video',
        });
        onChange([...mediaList, { ...uploaded, thumbnailUri, uploaded: true }]);
      } catch (e) {
        Alert.alert("Erreur", e.message);
      } finally {
        setUploading(false);
      }
    }
  }

  // Supprime un média
  function removeMedia(idx) {
    onChange(mediaList.filter((_, i) => i !== idx));
  }

  return (
    <View style={styles.wrap}>
      {/* Boutons upload */}
      <View style={styles.btns}>
        <TouchableOpacity style={styles.btn} onPress={pickPhoto} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color={colors.accent} />
            : <Text style={styles.btnText}>📷 Photo</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={pickVideo} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color={colors.accent} />
            : <Text style={styles.btnText}>🎥 Vidéo</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Prévisualisation des médias */}
      {mediaList.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          {mediaList.map((m, i) => (
            <View key={i} style={styles.preview}>
              {m.type === 'photo' ? (
                // Photo — affiche l'image uploadée
                <Image source={{ uri: m.url }} style={styles.previewImg} />
              ) : (
                // Vidéo — affiche la miniature avec icône play
                <View style={styles.videoPreview}>
                  {m.thumbnailUri
                    ? <Image source={{ uri: m.thumbnailUri }} style={styles.previewImg} />
                    : <Text style={{ fontSize: 24 }}>🎥</Text>
                  }
                  <View style={styles.playIcon}>
                    <Text style={{ color: '#fff', fontSize: 14 }}>▶</Text>
                  </View>
                </View>
              )}
              {/* Bouton suppression */}
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeMedia(i)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  btns: {
    flexDirection: 'row',
    gap:           spacing.sm,
  },
  btn: {
    flex:            1,
    padding:         spacing.md,
    backgroundColor: colors.light.bgInput,
    borderWidth:     1.5,
    borderStyle:     'dashed',
    borderColor:     colors.light.border,
    borderRadius:    radius.md,
    alignItems:      'center',
    minHeight:       48,
    justifyContent:  'center',
  },
  btnText: {
    fontSize:   typography.sm,
    fontWeight: typography.semibold,
    color:      colors.light.textSecondary,
  },
  preview: {
    position:    'relative',
    marginRight: spacing.sm,
    width:       80,
    height:      80,
  },
  previewImg: {
    width:        80,
    height:       80,
    borderRadius: radius.sm,
  },
  videoPreview: {
    width:           80,
    height:          80,
    borderRadius:    radius.sm,
    backgroundColor: colors.light.bgInput,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  playIcon: {
    position:        'absolute',
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  removeBtn: {
    position:        'absolute',
    top:             -6,
    right:           -6,
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  removeBtnText: {
    color:      '#fff',
    fontSize:   10,
    fontWeight: 'bold',
  },
});