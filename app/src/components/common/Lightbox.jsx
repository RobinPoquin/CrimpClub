import { Modal, View, Image, TouchableOpacity, Text } from 'react-native';
import VideoPlayer from '../ascent/VideoPlayer';

// Lightbox réutilisable pour afficher photos et vidéos en plein écran
export default function Lightbox({ media, onClose }) {
  return (
    <Modal visible={!!media} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}>
        {/* Bouton fermer */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 50, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          onPress={onClose}
        >
          <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
        </TouchableOpacity>

        {/* Photo */}
        {media?.type === 'photo' && (
          <Image source={{ uri: media.url }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
        )}

        {/* Vidéo */}
        {media?.type === 'video' && (
          <VideoPlayer url={media.url} />
        )}
      </View>
    </Modal>
  );
}