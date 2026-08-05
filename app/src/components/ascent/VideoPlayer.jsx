import { VideoView, useVideoPlayer } from 'expo-video';
import { useRef, useEffect } from 'react';

export default function VideoPlayer({ url }) {
  const player = useVideoPlayer(url, p => { p.play(); });
  const ref    = useRef(null);

  // Passe en plein écran dès l'ouverture
  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.enterFullscreen();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <VideoView
      ref={ref}
      player={player}
      style={{ width: '100%', height: 300 }}
      nativeControls
    />
  );
}