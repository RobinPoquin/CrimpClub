// Page appelée quand l'user clique sur le lien dans l'email Supabase
// Supabase injecte automatiquement la session via le hash de l'URL (#access_token=...)
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage({ onDone }) {
  const [newPwd, setNewPwd]       = useState("");
  const [confirmPwd, setConfirm]  = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [ready, setReady]         = useState(false);

  // Supabase émet un event "PASSWORD_RECOVERY" quand le lien est valide
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPwd.length < 6)     { setError("6 caractères minimum."); return; }
    if (newPwd !== confirmPwd) { setError("Les mots de passe ne correspondent pas."); return; }
    setSaving(true); setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setSuccess(true);
      setTimeout(onDone, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.png" alt="CrimpClub" className="auth-header-logo-img" />
          <h1>Crimp<span>Club</span></h1>
          <p>Nouveau mot de passe</p>
        </div>

        {success ? (
          <div className="forgot-sent">
            <p className="forgot-sent-icon">✅</p>
            <p className="forgot-sent-title">Mot de passe modifié !</p>
            <p className="forgot-sent-sub">Tu vas être redirigé vers l'application…</p>
          </div>
        ) : !ready ? (
          <div className="forgot-sent">
            <p className="forgot-sent-icon">⏳</p>
            <p className="forgot-sent-title">Vérification du lien…</p>
            <p className="forgot-sent-sub">Si tu arrives ici par erreur, retourne sur la page de connexion.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={onDone}>Retour</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input type="password" placeholder="6 caractères minimum" value={newPwd}
                onChange={e => { setNewPwd(e.target.value); setError(""); }} required />
            </div>
            <div className="field">
              <label>Confirmer</label>
              <input type="password" placeholder="Répète le mot de passe" value={confirmPwd}
                onChange={e => { setConfirm(e.target.value); setError(""); }} required />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Enregistrement…" : "Définir le nouveau mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
