import { useState } from "react";
import { signIn, signUp } from "../lib/auth";
import ForgotPasswordPage from "./ForgotPasswordPage";

// Détecte si on arrive depuis un lien de reset Supabase
// Supabase ajoute #access_token=...&type=recovery dans l'URL
export function isPasswordRecovery() {
  return window.location.hash.includes("type=recovery");
}

export default function AuthPage({ onLogin, theme, onToggleTheme }) {
  const [mode, setMode]   = useState("login"); // "login" | "signup" | "forgot"
  const [form, setForm]   = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError(""); setSuccess("");
  }

  function switchMode(m) {
    setMode(m);
    setError(""); setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "forgot") {
        const redirectTo = `${window.location.origin}${window.location.pathname}#reset`;
        await sendPasswordReset(form.email, redirectTo);
        setSuccess("Email envoyé ! Vérifie ta boîte mail pour réinitialiser ton mot de passe.");
        return;
      }
      let user;
      if (mode === "login") {
        user = await signIn({ email: form.email, password: form.password });
      } else {
        if (!form.displayName.trim()) throw new Error("Entre ton prénom ou pseudo.");
        if (form.password.length < 6)  throw new Error("Mot de passe trop court (6 caractères min.).");
        user = await signUp({ email: form.email, password: form.password, displayName: form.displayName });
      }
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot") return <ForgotPasswordPage onBack={() => setMode("login")} />;

  return (
    <div className="auth-page">
      <button className="theme-btn" style={{ position: "fixed", top: 16, right: 16 }}
        onClick={onToggleTheme} aria-label="Basculer le thème">
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.png" alt="CrimpClub" className="auth-header-logo-img" />
          <h1>Crimp<span>Club</span></h1>
          <p>
            <p>{mode === "login" ? "Content de te revoir 👋" : "Crée ton logbook gratuitement."}</p>
            <p className="auth-quote">"Le meilleur grimpeur n'est pas celui qui grimpe les plus grosses cotations mais celui qui prend le plus de plaisir"</p>
            {mode === "forgot" && "On va t'envoyer un lien de réinitialisation."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="displayName">Prénom ou pseudo</label>
              <input id="displayName" type="text" placeholder="ex. Martin"
                value={form.displayName} onChange={e => set("displayName", e.target.value)} required />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="toi@email.com"
              value={form.email} onChange={e => set("email", e.target.value)} required />
          </div>

          {mode !== "forgot" && (
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" type="password"
                placeholder={mode === "signup" ? "6 caractères minimum" : "••••••••"}
                value={form.password} onChange={e => set("password", e.target.value)} required />
            </div>
          )}

          {/* Lien mot de passe oublié sous le champ password */}
          {mode === "login" && (
            <button type="button" className="link-btn forgot-link"
              onClick={() => switchMode("forgot")}>
              Mot de passe oublié ?
            </button>
          )}

          {error   && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "…"
              : mode === "login"  ? "Se connecter"
              : mode === "signup" ? "Créer mon compte"
              : "Envoyer le lien"}
          </button>
        </form>

        <div className="auth-footer">
          {mode === "forgot" ? (
            <p className="auth-switch">
              <button className="link-btn" onClick={() => switchMode("login")}>← Retour à la connexion</button>
            </p>
          ) : (
            <p className="auth-switch">
              {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
              <button className="link-btn"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
