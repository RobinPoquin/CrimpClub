import { useRef, useState } from "react";
import { uploadAvatar, deleteAvatar } from "../lib/avatar";
import ImageCropper from "./ImageCropper";

export default function AvatarUploader({ userId, currentUrl, onUploaded, size = 72, folder = "avatars", placeholder = "👤" }) {
  const inputRef              = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [pendingFile, setPendingFile] = useState(null); // fichier en attente de crop

  async function handleCropped(croppedFile) {
    setPendingFile(null);
    setLoading(true); setError("");
    try {
      if (currentUrl) await deleteAvatar(currentUrl);
      const url = await uploadAvatar(userId, croppedFile, folder);
      onUploaded(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Max 10 MB."); return; }
    // Ouvre le cropper avant d'uploader
    setPendingFile(file);
  }

  return (
    <>
      <div className="avatar-uploader">
        <button
          type="button"
          className="avatar-upload-btn"
          style={{ width: size, height: size }}
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {currentUrl
            ? <img src={currentUrl} alt="Avatar" className="avatar-img" />
            : <span className="avatar-placeholder">{placeholder}</span>
          }
          <span className="avatar-overlay">{loading ? "…" : "📷"}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
        {error && <p className="error-msg" style={{ marginTop: 6, fontSize: 12 }}>{error}</p>}
      </div>

      {/* Cropper plein écran */}
      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          onCropped={handleCropped}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </>
  );
}