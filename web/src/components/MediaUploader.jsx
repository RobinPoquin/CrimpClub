import { useRef, useState } from "react";
import { uploadMedia, deleteMedia } from "../lib/storage";

export default function MediaUploader({ userId, mediaList = [], onChange }) {
  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const result = await uploadMedia(userId, file);
      onChange([...mediaList, result]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(idx) {
    const item = mediaList[idx];
    try {
      await deleteMedia(item.path);
    } catch (e) {
      // Continue même si suppression échoue
    }
    onChange(mediaList.filter((_, i) => i !== idx));
  }

  return (
    <div className="media-uploader">
      {/* Boutons d'ajout */}
      <div className="media-btns">
        <button
          type="button"
          className="btn-media"
          onClick={() => photoRef.current?.click()}
          disabled={uploading}
        >
          📷 {uploading ? "Upload…" : "Photo"}
        </button>
        <button
          type="button"
          className="btn-media"
          onClick={() => videoRef.current?.click()}
          disabled={uploading}
        >
          🎥 {uploading ? "Upload…" : "Vidéo"}
        </button>
      </div>

      {/* Inputs cachés */}
      <input
        ref={photoRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />

      {error && <p className="error-msg" style={{ marginTop: 8 }}>{error}</p>}

      {/* Prévisualisation */}
      {mediaList.length > 0 && (
        <div className="media-preview-grid">
          {mediaList.map((item, idx) => (
            <div key={idx} className="media-preview-item">
              {item.type === "photo" ? (
                <img src={item.url} alt={`Photo ${idx + 1}`} className="media-preview-img" />
              ) : (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="media-video-link">🎥 Voir la vidéo</a>
              )}
              <button
                type="button"
                className="media-remove-btn"
                onClick={() => handleRemove(idx)}
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
