import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import LogbookPage from "./pages/LogbookPage";
import AddAscentPage from "./pages/AddAscentPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import { getCurrentUser, signOut } from "./lib/auth";
import { getAscents } from "./lib/db";

const TABS = [
  { id: "logbook", label: "Logbook", icon: "📋" },
  { id: "add",     label: "Ajouter", icon: "➕" },
  { id: "stats",   label: "Stats",   icon: "📊" },
  { id: "profile", label: "Profil",  icon: "👤" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("logbook");
  const [ascents, setAscents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function handleAscentAdded() {
    loadAscents(user.id);
    setActiveTab("logbook");
  }

  if (loading) return <div className="loading">Chargement…</div>;
  if (!user)   return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      <main className="app-content">
        {activeTab === "logbook"  && <LogbookPage ascents={ascents} onAdd={() => setActiveTab("add")} />}
        {activeTab === "add"      && <AddAscentPage userId={user.id} onSaved={handleAscentAdded} onCancel={() => setActiveTab("logbook")} />}
        {activeTab === "stats"    && <StatsPage ascents={ascents} />}
        {activeTab === "profile"  && <ProfilePage user={user} ascents={ascents} onSignOut={handleSignOut} />}
      </main>
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={`nav-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)} aria-label={t.label}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
