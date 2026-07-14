import { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// Retourne un crop centré carré par défaut
function defaultCrop(width, height) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, width, height),
    width, height
  );
}

// Génère un Blob depuis le canvas cropé
async function getCroppedBlob(imgEl, crop, fileName) {
  const canvas = document.createElement("canvas");
  const scaleX = imgEl.naturalWidth  / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;
  const size   = 400; // taille finale en px
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    imgEl,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, size, size
  );

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(new File([blob], fileName, { type: "image/jpeg" })), "image/jpeg", 0.9);
  });
}

export default function ImageCropper({ file, onCropped, onCancel }) {
  const [crop, setCrop]       = useState(null);
  const [imgSrc, setImgSrc]   = useState(null);
  const imgRef                = useRef(null);

  // Charge l'image sélectionnée
  useState(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target.result);
    reader.readAsDataURL(file);
  }, [file]);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(defaultCrop(width, height));
  }

  async function handleConfirm() {
    if (!imgRef.current || !crop) return;
    const croppedFile = await getCroppedBlob(imgRef.current, crop, file.name);
    onCropped(croppedFile);
  }

  if (!imgSrc) return null;

  return (
    <div className="cropper-overlay">
      <div className="cropper-modal">
        <div className="cropper-header">
          <span className="cropper-title">Recadrer l'image</span>
          <button type="button" className="lightbox-close" style={{ position: "static" }} onClick={onCancel}>✕</button>
        </div>

        <div className="cropper-wrap">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              src={imgSrc}
              onLoad={onImageLoad}
              className="cropper-img"
              alt="Recadrage"
            />
          </ReactCrop>
        </div>

        <div className="cropper-actions">
          <button type="button" className="sheet-cancel" onClick={onCancel}>Annuler</button>
          <button type="button" className="btn-primary" onClick={handleConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}