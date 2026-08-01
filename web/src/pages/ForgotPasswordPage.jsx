import { useState } from "react";
import { sendPasswordReset } from "../lib/auth";

export default function ForgotPasswordPage({ onBack }) {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Entre ton adresse email."); return; }
    setLoading(true); setError("");
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || JSON.stringify(err) || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.png" alt="CrimpClub" className="auth-header-logo-img" />
          <h1>Crimp<span>Club</span></h1>
          <p>Réinitialisation du mot de passe</p>
        </div>

        {sent ? (
          <div className="forgot-sent">
            <p className="forgot-sent-icon">📬</p>
            <p className="forgot-sent-title">Email envoyé !</p>
            <p className="forgot-sent-sub">
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
              Vérifie tes spams si tu ne le vois pas.
            </p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={onBack}>
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
              Entre ton adresse email et on t'enverra un lien pour réinitialiser ton mot de passe.
            </p>
            <div className="field">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                placeholder="toi@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                required
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>

            <button type="button" className="link-btn" style={{ textAlign: "center", display: "block", margin: "8px auto 0" }} onClick={onBack}>
              ← Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
