import { useState } from "react";
import { updateProfile, updatePassword } from "../lib/auth";
import AvatarUploader from "../components/AvatarUploader";

export default function SettingsPage({ user, onBack, onUserUpdated }) {
  const [tab, setTab]         = useState("profile"); // "profile" | "password"
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  // Profil
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail]             = useState(user.email || "");
  const [bio, setBio]                 = useState(user.bio || "");

  // Mot de passe
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");

  function reset() { setError(""); setSuccess(""); }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!displayName.trim()) { setError("Le pseudo ne peut pas être vide."); return; }
    setSaving(true); reset();
    try {
      const updated = await updateProfile({ displayName, email, bio });
      onUserUpdated(updated);
      setSuccess("Profil mis à jour ✓");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    if (newPwd.length < 6)      { setError("Le mot de passe doit faire 6 caractères minimum."); return; }
    if (newPwd !== confirmPwd)  { setError("Les mots de passe ne correspondent pas."); return; }
    setSaving(true); reset();
    try {
      await updatePassword(newPwd);
      setSuccess("Mot de passe modifié ✓");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-text" onClick={onBack}>← Profil</button>
        <h1>Paramètres</h1>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button className={`stab ${tab === "profile"  ? "stab-active" : ""}`} onClick={() => { setTab("profile");  reset(); }}>Mon compte</button>
        <button className={`stab ${tab === "password" ? "stab-active" : ""}`} onClick={() => { setTab("password"); reset(); }}>Mot de passe</button>
      </div>

      {/* ── Onglet profil ── */}
      {tab === "profile" && (
        <form onSubmit={handleSaveProfile} className="add-form">

          {/* Avatar */}
          <div className="field" style={{ alignItems: "center" }}>
            <label>Photo de profil</label>
            <AvatarUploader
              userId={user.id}
              currentUrl={user.avatarUrl}
              folder="avatars"
              onUploaded={async (url) => {
                const updated = await updateProfile({ 
                  displayName, 
                  email, 
                  bio, 
                  avatarUrl: url 
                });
                onUserUpdated(updated);
              }}
            />
          </div>
          
          <div className="field">
            <label>Pseudo / Prénom</label>
            <input type="text" value={displayName} onChange={e => { setDisplayName(e.target.value); reset(); }} placeholder="ex. Martin" />
          </div>

          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); reset(); }} placeholder="toi@email.com" />
            {email !== user.email && (
              <p className="field-hint">⚠️ Un email de confirmation sera envoyé à la nouvelle adresse.</p>
            )}
          </div>

          <div className="field">
            <label>Bio <span className="optional">(optionnel)</span></label>
            <textarea rows={3} value={bio} onChange={e => { setBio(e.target.value); reset(); }} placeholder="Grimpeur depuis 2019, fan de falaise calcaire…" />
          </div>

          {error   && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </form>
      )}

      {/* ── Onglet mot de passe ── */}
      {tab === "password" && (
        <form onSubmit={handleSavePassword} className="add-form">
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input type="password" value={newPwd} onChange={e => { setNewPwd(e.target.value); reset(); }} placeholder="6 caractères minimum" />
          </div>

          <div className="field">
            <label>Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); reset(); }} placeholder="Répète le mot de passe" />
          </div>

          {error   && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Modification…" : "Changer le mot de passe"}
          </button>
        </form>
      )}
    </div>
  );
}
