import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import LogbookPage from "./pages/LogbookPage";
import AddAscentPage from "./pages/AddAscentPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import GymManagerPage from "./pages/GymManagerPage";
import SettingsPage from "./pages/SettingsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SpotManagerPage from "./pages/SpotManagerPage";
import { getCurrentUser, signOut } from "./lib/auth";
import { getAscents, getAscentsPaginated, deleteAscent } from "./lib/db";
import { getGyms } from "./lib/gyms";
import { supabase } from "./lib/supabase";
import { getLocations } from "./lib/locations";
import { getSectors } from "./lib/sectors";

const TABS = [
  { id: "logbook", label: "Logbook", icon: "📋" },
  { id: "add",     label: "Ajouter", icon: "➕" },
  { id: "stats",   label: "Stats",   icon: "📊" },
  { id: "profile", label: "Profil",  icon: "👤" },
];

export default function App() {
  const [user, setUser]             = useState(null);
  const [activeTab, setActiveTab]   = useState("logbook");
  const [subPage, setSubPage]       = useState(null); // "gyms" | "settings" | "reset-password"
  const [ascents, setAscents]       = useState([]);
  const [gyms, setGyms]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editAscent, setEditAscent] = useState(null);
  const [theme, setTheme]           = useState(() => localStorage.getItem("cc_theme") || "light");
  const [locations, setLocations]   = useState([]);
  const [spots, setSpots]           = useState([]);
  const [sectors, setSectors]       = useState([]);
  const [ascentPage, setAscentPage]   = useState(0);   // page courante
  const [hasMore, setHasMore]         = useState(true); // s'il reste des ascensions à charger
  const [loadingMore, setLoadingMore] = useState(false); // chargement en cours
  const [allAscents, setAllAscents] = useState([]); // toutes les ascensions pour les stats


  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cc_theme", theme);
  }, [theme]);

  useEffect(() => {
    // Détecte le lien de reset password dans l'URL
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setSubPage("reset-password");
      setLoading(false);
      return;
    }

    getCurrentUser().then((u) => {
      setUser(u);
      if (u) { loadAscents(u.id); loadAllAscents(u.id); loadGyms(u.id); loadSpots(u.id); loadSectors(u.id); }
      setLoading(false);
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    // Écoute les changements d'auth (utile pour la récupération de session après reset)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSubPage("reset-password");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Charge la première page d'ascensions
  async function loadAscents(userId) {
    const data = await getAscentsPaginated(userId, 0);
    setAscents(data);
    setAscentPage(0);
    // S'il y a moins de 20 résultats, il n'y a plus rien à charger
    setHasMore(data.length === 20);
  }

  // Charge la page suivante et l'ajoute à la liste existante
  async function loadMoreAscents() {

    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = ascentPage + 1;
      const data = await getAscentsPaginated(user?.id, nextPage);
      setAscents(prev => [...prev, ...data]);
      setAscentPage(nextPage);
      setHasMore(data.length === 20);
    } finally {
      setLoadingMore(false);
    }
  }

  // Charge TOUTES les ascensions pour les stats (sans pagination)
  async function loadAllAscents(userId) {
    const data = await getAscents(userId);
    setAllAscents(data);
  }

  async function loadGyms(userId) {
    const data = await getGyms(userId);
    setGyms(data);
  }

  function handleLogin(u) {
    setUser(u);
    loadAscents(u.id);
    loadGyms(u.id);
    loadSpots(u.id);
    loadSectors(u.id);
    migrateMediaUrls(); // Migration one-shot
    setActiveTab("logbook");
    loadAllAscents(u.id);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setAscents([]);
    setGyms([]);
  }

  // Charge les secteurs extérieurs mémorisés
  async function loadSectors(userId) {
    const data = await getSectors(userId);
    setSectors(data);
  }

  function handleAscentSaved() {
    loadAscents(user.id);
    loadSpots(user.id);
    loadGyms(user.id);
    loadSectors(user.id);
    setEditAscent(null);
    setActiveTab("logbook");
    loadAllAscents(u.id);
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

  function handleUserUpdated(updatedUser) {
    setUser(updatedUser);
  }

  async function loadSpots(userId) {
    const data = await getLocations(userId);

    // Sépare les spots extérieurs des salles intérieures
    setSpots(data.filter(l => l.is_outdoor));
    setLocations(data.filter(l => !l.is_outdoor));
  }

  if (loading) return <div className="loading">Chargement…</div>;

  // Page de réinitialisation de mot de passe (depuis email)
  if (subPage === "reset-password") return (
    <ResetPasswordPage onDone={() => {
      setSubPage(null);
      window.history.replaceState(null, "", window.location.pathname);
      getCurrentUser().then(u => { if (u) { setUser(u); loadAscents(u.id); loadGyms(u.id); } });
    }} />
  );

  if (!user) return (
    <AuthPage
      onLogin={handleLogin}
      theme={theme}
      onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
    />
  );

  // Sous-pages (par-dessus le contenu principal)
  if (subPage === "gyms") return (
    <div className="app-shell">
      <main className="app-content">
        <GymManagerPage
          userId={user.id}
          gyms={gyms}
          onGymsChanged={() => loadGyms(user.id)}
          onBack={() => setSubPage(null)}
        />
      </main>
    </div>
  );

  if (subPage === "settings") return (
    <div className="app-shell">
      <main className="app-content">
        <SettingsPage
          user={user}
          ascents={ascents}
          onBack={() => setSubPage(null)}
          onUserUpdated={handleUserUpdated}
        />
      </main>
    </div>
  );

  if (subPage === "spots") return (
    <div className="app-shell">
      <main className="app-content">
        <SpotManagerPage
          userId={user.id}
          spots={spots}
          onSpotsChanged={() => loadSpots(user.id)}
          onBack={() => setSubPage(null)}
        />
      </main>
    </div>
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/logo.png" alt="CrimpClub" className="topbar-logo-img" />
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
            gyms={gyms}
            onAdd={() => { setEditAscent(null); setActiveTab("add"); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMoreAscents}
          />
        )}
        {activeTab === "add" && (
          <AddAscentPage
            userId={user.id}
            gyms={gyms}
            spots={spots}
            locations={locations}
            sectors={sectors}
            onSaved={handleAscentSaved}
            onCancel={handleCancelForm}
            onGymsChanged={async () => { await loadGyms(user.id); }}
            editAscent={editAscent}
          />
        )}
        {activeTab === "stats"   && <StatsPage ascents={allAscents} gyms={gyms} />}
        {activeTab === "profile" && (
          <ProfilePage
            user={user}
            ascents={allAscents}
            spots={spots}
            gyms={gyms}
            onSignOut={handleSignOut}
            onOpenGyms={() => setSubPage("gyms")}
            onOpenSettings={() => setSubPage("settings")}
            onOpenSpots={() => setSubPage("spots")}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => {
              if (t.id === "add") setEditAscent(null);
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
