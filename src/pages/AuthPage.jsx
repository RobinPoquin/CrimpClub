import { useState } from "react";
import { signIn, signUp } from "../lib/auth";

export default function AuthPage({ onLogin, theme, onToggleTheme }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      let user;
      if (mode === "login") {
        user = await signIn({ email: form.email, password: form.password });
      } else {
        if (!form.displayName.trim()) throw new Error("Entre ton prénom ou pseudo.");
        if (form.password.length < 6) throw new Error("Mot de passe trop court (6 caractères min.).");
        user = await signUp({ email: form.email, password: form.password, displayName: form.displayName });
      }
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <button
        className="theme-btn"
        style={{ position: "fixed", top: 16, right: 16 }}
        onClick={onToggleTheme}
        aria-label="Basculer le thème"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.png" alt="CrimpClub" className="auth-header-logo-img" />
          <h1>Crimp<span>Club</span></h1>
          <p>{mode === "login" ? "Content de te revoir 👋" : "Crée ton logbook gratuitement."}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="displayName">Prénom ou pseudo</label>
              <input id="displayName" type="text" placeholder="ex. Martin" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="toi@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input id="password" type="password" placeholder={mode === "signup" ? "6 caractères minimum" : "••••••••"} value={form.password} onChange={(e) => set("password", e.target.value)} required />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
          <button className="link-btn" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
}
