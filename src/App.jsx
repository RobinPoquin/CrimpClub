import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import LogbookPage from "./pages/LogbookPage";
import AddAscentPage from "./pages/AddAscentPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import { getCurrentUser, signOut } from "./lib/auth";
import { getAscents, deleteAscent } from "./lib/db";

const TABS = [
  { id: "logbook", label: "Logbook", icon: "📋" },
  { id: "add",     label: "Ajouter", icon: "➕" },
  { id: "stats",   label: "Stats",   icon: "📊" },
  { id: "profile", label: "Profil",  icon: "👤" },
];

export default function App() {
  const [user, setUser]         = useState(null);
  const [activeTab, setActiveTab] = useState("logbook");
  const [ascents, setAscents]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editAscent, setEditAscent] = useState(null); // ascension en cours d'édition
  const [theme, setTheme]       = useState(() => localStorage.getItem("cc_theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cc_theme", theme);
  }, [theme]);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      if (u) loadAscents(u.id);
      setLoading(false);
    });
  }, []);

  async function loadAscents(userId) {
    const data = await getAscents(userId);
    setAscents(data);
  }

  function handleLogin(u) {
    setUser(u);
    loadAscents(u.id);
    setActiveTab("logbook");
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setAscents([]);
  }

  function handleAscentSaved() {
    loadAscents(user.id);
    setEditAscent(null);
    setActiveTab("logbook");
  }

  function handleEdit(ascent) {
    setEditAscent(ascent);
    setActiveTab("add");
  }

  function handleCancelForm() {
    setEditAscent(null);
    setActiveTab("logbook");
  }

  async function handleDelete(id) {
    await deleteAscent(id);
    loadAscents(user.id);
  }

  if (loading) return <div className="loading">Chargement…</div>;
  if (!user)   return (
    <AuthPage
      onLogin={handleLogin}
      theme={theme}
      onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
    />
  );

  const showForm = activeTab === "add";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">🧗</div>
          <span className="topbar-name">CrimpClub</span>
        </div>
        <div className="topbar-actions">
          <button
            className="theme-btn"
            onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            aria-label="Basculer le thème"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <main className="app-content">
        {activeTab === "logbook" && (
          <LogbookPage
            ascents={ascents}
            onAdd={() => { setEditAscent(null); setActiveTab("add"); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {showForm && (
          <AddAscentPage
            userId={user.id}
            onSaved={handleAscentSaved}
            onCancel={handleCancelForm}
            editAscent={editAscent}
          />
        )}
        {activeTab === "stats"   && <StatsPage ascents={ascents} />}
        {activeTab === "profile" && <ProfilePage user={user} ascents={ascents} onSignOut={handleSignOut} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => {
              if (t.id === "add") { setEditAscent(null); }
              setActiveTab(t.id);
            }}
            aria-label={t.label}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
